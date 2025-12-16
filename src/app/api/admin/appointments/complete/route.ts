import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSettings, calculateTierFromSettings } from "@/lib/settings";
import { checkOwnerAdminOrModerator } from "@/lib/auth";

// POST - označi termin kao završen i dodijeli bodove
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const authCheck = await checkOwnerAdminOrModerator(token);
        if (!authCheck) {
            return NextResponse.json({ error: "Nemate dozvolu za ovu akciju" }, { status: 403 });
        }

        const { appointmentId } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ error: "ID termina je obavezan" }, { status: 400 });
        }

        // Pronađi termin
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { user: true },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Termin nije pronađen" }, { status: 404 });
        }

        if (appointment.isCompleted) {
            return NextResponse.json({ error: "Termin je već označen kao završen" }, { status: 400 });
        }

        if (!appointment.userId) {
            return NextResponse.json({ error: "Termin nema povezanog korisnika" }, { status: 400 });
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
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
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
    };

    return servicePoints[service] || defaultPoints;
}

// PUT - označi termin kao neizvršen i oduzmi bodove
export async function PUT(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const authCheck = await checkOwnerAdminOrModerator(token);
        if (!authCheck) {
            return NextResponse.json({ error: "Nemate dozvolu za ovu akciju" }, { status: 403 });
        }

        const { appointmentId } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ error: "ID termina je obavezan" }, { status: 400 });
        }

        // Pronađi termin
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { user: true },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Termin nije pronađen" }, { status: 404 });
        }

        if (!appointment.isCompleted) {
            return NextResponse.json({ error: "Termin nije označen kao završen" }, { status: 400 });
        }

        if (!appointment.userId) {
            return NextResponse.json({ error: "Termin nema povezanog korisnika" }, { status: 400 });
        }

        // Oduzmi bodove ako su bili dodijeljeni
        if (appointment.pointsEarned && appointment.pointsEarned > 0) {
            // Provjeri da korisnik ima dovoljno bodova
            const user = await prisma.user.findUnique({
                where: { id: appointment.userId },
            });

            if (!user) {
                return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
            }

            // Oduzmi bodove (ali ne dozvoli negativne bodove)
            const newPoints = Math.max(0, user.loyaltyPoints - appointment.pointsEarned);

            await prisma.user.update({
                where: { id: appointment.userId },
                data: {
                    loyaltyPoints: newPoints,
                    totalVisits: {
                        decrement: 1,
                    },
                },
            });

            // Kreiraj transakciju za oduzimanje bodova
            await prisma.loyaltyTransaction.create({
                data: {
                    userId: appointment.userId,
                    points: -appointment.pointsEarned,
                    type: "admin_adjust",
                    description: `Oduzeto ${appointment.pointsEarned} bodova - termin označen kao neizvršen: ${appointment.service}`,
                    appointmentId: appointmentId,
                },
            });
        }

        // Ažuriraj termin
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                isCompleted: false,
                pointsEarned: null,
            },
        });

        return NextResponse.json({
            message: "Termin označen kao neizvršen",
            pointsRemoved: appointment.pointsEarned || 0,
        });
    } catch (error) {
        console.error("PUT /admin/appointments/complete error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

