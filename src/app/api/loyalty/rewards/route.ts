import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    console.error("JWT_SECRET nije definiran u environment varijablama");
}

// GET - dohvati dostupne nagrade
export async function GET(req: Request) {
    try {
        const rewards = await prisma.loyaltyReward.findMany({
            where: { isActive: true },
            orderBy: { pointsCost: "asc" },
        });

        return NextResponse.json({ rewards });
    } catch (error) {
        console.error("GET /loyalty/rewards error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

// POST - iskoristi nagradu (kuponi)
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
        const { rewardId } = await req.json();

        if (!rewardId) {
            return NextResponse.json({ error: "ID nagrade je obavezan" }, { status: 400 });
        }

        // Provjeri nagradu
        const reward = await prisma.loyaltyReward.findUnique({
            where: { id: rewardId },
        });

        if (!reward || !reward.isActive) {
            return NextResponse.json({ error: "Nagrada nije pronađena ili nije aktivna" }, { status: 404 });
        }

        // Provjeri korisnika i bodove
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
        }

        if (user.loyaltyPoints < reward.pointsCost) {
            return NextResponse.json(
                { error: `Nedovoljno bodova. Trebate ${reward.pointsCost}, imate ${user.loyaltyPoints}` },
                { status: 400 }
            );
        }

        // Oduzmi bodove i kreiraj transakciju
        const updatedUser = await prisma.user.update({
            where: { id: decoded.userId },
            data: {
                loyaltyPoints: {
                    decrement: reward.pointsCost,
                },
            },
        });

        await prisma.loyaltyTransaction.create({
            data: {
                userId: decoded.userId,
                points: -reward.pointsCost,
                type: "redeemed",
                description: `Iskorištena nagrada: ${reward.name}`,
                rewardId: rewardId,
            },
        });

        return NextResponse.json({
            message: "Nagrada uspješno iskorištena",
            reward: {
                name: reward.name,
                discount: reward.discount,
            },
            remainingPoints: updatedUser.loyaltyPoints,
        });
    } catch (error) {
        console.error("POST /loyalty/rewards error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

