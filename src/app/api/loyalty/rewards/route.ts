import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

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
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST - iskoristi nagradu (kuponi)
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const { rewardId } = await req.json();

        if (!rewardId) {
            return NextResponse.json({ error: "Reward ID required" }, { status: 400 });
        }

        // Provjeri nagradu
        const reward = await prisma.loyaltyReward.findUnique({
            where: { id: rewardId },
        });

        if (!reward || !reward.isActive) {
            return NextResponse.json({ error: "Reward not found or inactive" }, { status: 404 });
        }

        // Provjeri korisnika i bodove
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
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
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

