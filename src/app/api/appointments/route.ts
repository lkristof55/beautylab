import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

// GET - vrati sve termine
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        const appointments = await prisma.appointment.findMany({
            where: { userId: decoded.userId },
            orderBy: { date: "asc" },
        });

        return NextResponse.json({ appointments });
    } catch (error) {
        console.error("GET /appointments error:", error);
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
}

// POST - kreiraj novi termin
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const { date, service, duration } = await req.json();

        if (!date || !service) {
            return NextResponse.json({ error: "Datum i usluga su obavezni" }, { status: 400 });
        }

        const appointmentDate = new Date(date);
        const now = new Date();

        // Provjera da termin nije u prošlosti
        if (appointmentDate < now) {
            return NextResponse.json(
                { error: "Ne možete rezervirati termin u prošlosti" },
                { status: 400 }
            );
        }

        // Provjera radnog vremena (9:00 - 19:00)
        const hour = appointmentDate.getHours();
        if (hour < 9 || hour >= 19) {
            return NextResponse.json(
                { error: "Radno vrijeme je od 9:00 do 19:00" },
                { status: 400 }
            );
        }

        // Provjera zauzetosti termina
        const appointmentDuration = duration || 60; // default 60 minuta
        const appointmentEnd = new Date(appointmentDate.getTime() + appointmentDuration * 60000);

        const conflictingAppointments = await prisma.appointment.findMany({
            where: {
                date: {
                    lt: appointmentEnd,
                },
            },
        });

        // Provjeri preklapanje
        for (const existing of conflictingAppointments) {
            const existingStart = new Date(existing.date);
            const existingDuration = 60; // default duration
            const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);

            // Provjeri preklapanje
            if (
                (appointmentDate >= existingStart && appointmentDate < existingEnd) ||
                (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
                (appointmentDate <= existingStart && appointmentEnd >= existingEnd)
            ) {
                return NextResponse.json(
                    {
                        error: `Termin je zauzet. Već postoji rezervacija od ${existingStart.toLocaleTimeString("hr-HR", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}`,
                    },
                    { status: 409 }
                );
            }
        }

        const appointment = await prisma.appointment.create({
            data: {
                date: appointmentDate,
                service,
                userId: decoded.userId,
            },
        });

        return NextResponse.json({ appointment });
    } catch (error) {
        console.error("POST /appointments error:", error);
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: "Nevažeći token" }, { status: 401 });
        }
        return NextResponse.json({ error: "Greška pri kreiranju termina" }, { status: 500 });
    }
}

// DELETE - otkaži termin
export async function DELETE(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const { appointmentId } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ error: "Appointment ID required" }, { status: 400 });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment || appointment.userId !== decoded.userId) {
            return NextResponse.json({ error: "Appointment not found or unauthorized" }, { status: 404 });
        }

        const now = new Date();
        const diffHours = (new Date(appointment.date).getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours < 24) {
            return NextResponse.json(
                { error: "Termin se može otkazati najmanje 24h prije." },
                { status: 400 }
            );
        }

        await prisma.appointment.delete({ where: { id: appointmentId } });
        return NextResponse.json({ message: "Termin otkazan." });
    } catch (error) {
        console.error("DELETE /appointments error:", error);
        return NextResponse.json({ error: "Greška pri otkazivanju." }, { status: 500 });
    }
}
