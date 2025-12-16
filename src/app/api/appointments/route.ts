import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { findAvailableEmployee } from "@/lib/employees";
import { SERVICES_CONFIG } from "@/lib/services";

const JWT_SECRET = process.env.JWT_SECRET as string;

// GET - vrati sve termine
export async function GET(req: Request) {
    try {
        if (!JWT_SECRET) {
            console.error("JWT_SECRET nije definiran u environment varijablama");
            return NextResponse.json(
                { error: "Greška konfiguracije servera" },
                { status: 500 }
            );
        }

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
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
        return NextResponse.json({ error: "Nevažeći ili istekao token" }, { status: 401 });
    }
}

// POST - kreiraj novi termin
export async function POST(req: Request) {
    try {
        if (!JWT_SECRET) {
            console.error("JWT_SECRET nije definiran u environment varijablama");
            return NextResponse.json(
                { error: "Greška konfiguracije servera" },
                { status: 500 }
            );
        }

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

        // Provjera zauzetosti termina s maxConcurrent ograničenjem
        const serviceConfig = SERVICES_CONFIG[service];
        const appointmentDuration = duration || serviceConfig?.duration || 60;
        const appointmentEnd = new Date(appointmentDate.getTime() + appointmentDuration * 60000);
        const maxConcurrent = serviceConfig?.maxConcurrent || 1;

        // Provjeri preklapanje sa svim postojećim terminima
        const allOverlapping = await prisma.appointment.findFirst({
            where: {
                date: {
                    lt: appointmentEnd,
                },
                AND: {
                    date: {
                        gte: appointmentDate,
                    },
                },
            },
        });

        if (allOverlapping) {
            return NextResponse.json(
                { error: "Odabrani termin se preklapa s postojećim terminom." },
                { status: 400 }
            );
        }

        // Provjeri maxConcurrent za istu uslugu
        const overlappingAppointments = await prisma.appointment.findMany({
            where: {
                service: service,
                date: {
                    lt: appointmentEnd,
                },
                AND: {
                    date: {
                        gte: appointmentDate,
                    },
                },
            },
        });

        if (overlappingAppointments.length >= maxConcurrent) {
            return NextResponse.json(
                {
                    error: `Maksimalan broj istovremenih rezervacija za uslugu "${service}" je ${maxConcurrent}. Već postoji ${overlappingAppointments.length} rezervacija u tom vremenskom slotu.`,
                },
                { status: 409 }
            );
        }

        // Automatska dodjela zaposlenika
        const assignedEmployeeId = await findAvailableEmployee(service, appointmentDate, appointmentEnd);

        const appointment = await prisma.appointment.create({
            data: {
                date: appointmentDate,
                service,
                userId: decoded.userId,
                assignedEmployeeId: assignedEmployeeId || undefined,
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
        if (!JWT_SECRET) {
            console.error("JWT_SECRET nije definiran u environment varijablama");
            return NextResponse.json(
                { error: "Greška konfiguracije servera" },
                { status: 500 }
            );
        }

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const { appointmentId } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ error: "ID termina je obavezan" }, { status: 400 });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment || appointment.userId !== decoded.userId) {
            return NextResponse.json({ error: "Termin nije pronađen ili nemate dozvolu" }, { status: 404 });
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
