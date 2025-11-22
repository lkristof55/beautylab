import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { getSettings, calculateTierFromSettings } from "@/lib/settings";

const JWT_SECRET = process.env.JWT_SECRET as string;

// POST - označi termin kao završen i dodijeli bodove
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

        // Provjeri da li je admin
        const adminUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!adminUser || (!adminUser.isAdmin && adminUser.email !== "irena@beautylab.hr")) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const { appointmentId } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ error: "Appointment ID required" }, { status: 400 });
        }

        // Pronađi termin
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { user: true },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        if (appointment.isCompleted) {
            return NextResponse.json({ error: "Appointment already completed" }, { status: 400 });
        }

        if (!appointment.userId) {
            return NextResponse.json({ error: "Appointment has no user" }, { status: 400 });
        }

        // Dohvati postavke
        const settings = await getSettings();
        
        // Izračunaj bodove na osnovu usluge (koristi default iz postavki)
        const pointsEarned = calculatePointsForService(appointment.service, settings.defaultPointsPerService);

        // Ažuriraj termin
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                isCompleted: true,
                pointsEarned: pointsEarned,
            },
        });

        // Ažuriraj korisnika
        const updatedUser = await prisma.user.update({
            where: { id: appointment.userId },
            data: {
                loyaltyPoints: {
                    increment: pointsEarned,
                },
                totalVisits: {
                    increment: 1,
                },
            },
        });

        // Kreiraj transakciju
        await prisma.loyaltyTransaction.create({
            data: {
                userId: appointment.userId,
                points: pointsEarned,
                type: "earned",
                description: `Završen termin: ${appointment.service}`,
                appointmentId: appointmentId,
            },
        });

        // Ažuriraj tier ako je potrebno (koristi postavke)
        if (settings.autoUpdateTiers) {
            const newTier = calculateTierFromSettings(updatedUser.loyaltyPoints, settings);
            if (newTier !== updatedUser.loyaltyTier) {
                await prisma.user.update({
                    where: { id: appointment.userId },
                    data: { loyaltyTier: newTier },
                });
            }
        }

        const finalUser = await prisma.user.findUnique({ where: { id: appointment.userId } });
        
        return NextResponse.json({
            message: "Termin označen kao završen",
            pointsEarned,
            newTier: finalUser?.loyaltyTier,
        });
    } catch (error) {
        console.error("POST /admin/appointments/complete error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// Helper funkcija za izračun bodova po usluzi
function calculatePointsForService(service: string, defaultPoints: number): number {
    const servicePoints: { [key: string]: number } = {
        "Manikura": 10,
        "Gel nokti": 15,
        "Pedikura": 12,
        "Depilacija - noge": 10,
        "Depilacija - bikini": 8,
        "Masaža": 15,
        "Trepavice": 20,
        "Obrve": 8,
    };

    return servicePoints[service] || defaultPoints;
}

