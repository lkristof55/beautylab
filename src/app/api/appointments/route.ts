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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const { date, service } = await req.json();

        if (!date || !service) {
            return NextResponse.json({ error: "Date and service required" }, { status: 400 });
        }

        const appointment = await prisma.appointment.create({
            data: {
                date: new Date(date),
                service,
                userId: decoded.userId,
            },
        });

        return NextResponse.json({ appointment });
    } catch (error) {
        console.error("POST /appointments error:", error);
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
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
