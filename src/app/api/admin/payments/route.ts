import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkOwnerAdminOrModerator } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// GET - lista plaćanja
export async function GET(req: Request) {
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

        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date");
        const userId = searchParams.get("userId");

        const where: any = {};
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            where.createdAt = { gte: startDate, lte: endDate };
        }
        if (userId) {
            where.userId = userId;
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                appointment: {
                    select: { id: true, service: true, date: true }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ payments });
    } catch (error) {
        console.error("GET /admin/payments error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

// POST - kreiranje plaćanja
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

        const {
            appointmentId,
            userId,
            amount,
            paymentMethod,
            loyaltyPointsUsed,
            discountApplied,
            rewardId
        } = await req.json();

        if (!userId || !amount || !paymentMethod) {
            return NextResponse.json(
                { error: "Korisnik, iznos i način plaćanja su obavezni" },
                { status: 400 }
            );
        }

        // Provjeri da korisnik postoji
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
        }

        // Provjeri da korisnik ima dovoljno loyalty bodova (ako koristi)
        if (loyaltyPointsUsed && loyaltyPointsUsed > 0) {
            if (user.loyaltyPoints < loyaltyPointsUsed) {
                return NextResponse.json(
                    { error: "Korisnik nema dovoljno loyalty bodova" },
                    { status: 400 }
                );
            }
        }

        // Dohvati postavke za obračun bodova
        const settings = await getSettings();
        const pointsPerCurrency = settings.pointsPerCurrencyUnit || 1.0;
        const pointsEarned = Math.floor(amount * pointsPerCurrency);

        // Kreiraj plaćanje
        const payment = await prisma.payment.create({
            data: {
                appointmentId: appointmentId || null,
                userId,
                amount,
                paymentMethod,
                loyaltyPointsUsed: loyaltyPointsUsed || 0,
                discountApplied: discountApplied || 0,
            },
        });

        // Ažuriraj korisnika
        const updateData: any = {
            totalSpent: { increment: amount },
        };

        // Oduzmi loyalty bodove ako su korišteni
        if (loyaltyPointsUsed && loyaltyPointsUsed > 0) {
            updateData.loyaltyPoints = { decrement: loyaltyPointsUsed };
        }

        // Dodaj nove bodove (ako nije korišten reward)
        if (!rewardId && pointsEarned > 0) {
            updateData.loyaltyPoints = {
                ...(updateData.loyaltyPoints || {}),
                increment: pointsEarned
            };
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        // Kreiraj loyalty transakcije
        if (loyaltyPointsUsed && loyaltyPointsUsed > 0) {
            await prisma.loyaltyTransaction.create({
                data: {
                    userId,
                    points: -loyaltyPointsUsed,
                    type: "redeemed",
                    description: `Iskorišteno ${loyaltyPointsUsed} bodova za plaćanje`,
                    appointmentId: appointmentId || null,
                    rewardId: rewardId || null,
                },
            });
        }

        if (!rewardId && pointsEarned > 0) {
            await prisma.loyaltyTransaction.create({
                data: {
                    userId,
                    points: pointsEarned,
                    type: "earned",
                    description: `Zaradeno ${pointsEarned} bodova za plaćanje od ${amount} kn`,
                    appointmentId: appointmentId || null,
                },
            });
        }

        // Ažuriraj ili kreiraj CashRegister za danas
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.cashRegister.upsert({
            where: { date: today },
            update: {
                totalAmount: { increment: amount },
                totalTransactions: { increment: 1 },
            },
            create: {
                date: today,
                totalAmount: amount,
                totalTransactions: 1,
            },
        });

        return NextResponse.json({
            payment,
            message: "Plaćanje uspješno kreirano",
            pointsEarned: !rewardId ? pointsEarned : 0
        }, { status: 201 });
    } catch (error) {
        console.error("POST /admin/payments error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}





