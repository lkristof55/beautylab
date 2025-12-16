import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkOwnerAdminOrModerator } from "@/lib/auth";
import { SERVICES_CONFIG } from "@/lib/services";

// POST - primijeni popust na termin
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

        const { appointmentId, discountPercent } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ error: "ID termina je obavezan" }, { status: 400 });
        }

        if (!discountPercent || ![5, 10, 20].includes(discountPercent)) {
            return NextResponse.json(
                { error: "Popust mora biti 5%, 10% ili 20%" },
                { status: 400 }
            );
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
            return NextResponse.json(
                { error: "Popust se može primijeniti samo na završene termine" },
                { status: 400 }
            );
        }

        // Izračunaj iznos popusta na osnovu cijene usluge
        const serviceConfig = SERVICES_CONFIG[appointment.service];
        if (!serviceConfig) {
            return NextResponse.json(
                { error: "Usluga nije pronađena u konfiguraciji" },
                { status: 400 }
            );
        }

        const servicePrice = serviceConfig.price;
        const discountAmount = (servicePrice * discountPercent) / 100;

        // Ažuriraj termin s popustom
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                discountApplied: discountAmount,
            },
        });

        // Ažuriraj korisnika - smanji totalSpent za iznos popusta
        if (appointment.userId) {
            await prisma.user.update({
                where: { id: appointment.userId },
                data: {
                    totalSpent: {
                        decrement: discountAmount,
                    },
                },
            });
        }

        return NextResponse.json({
            message: `Popust od ${discountPercent}% uspješno primijenjen`,
            discountAmount: discountAmount,
            originalPrice: servicePrice,
            finalPrice: servicePrice - discountAmount,
        });
    } catch (error) {
        console.error("POST /admin/appointments/apply-discount error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}





