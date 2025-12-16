import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkOwnerOrAdmin } from "@/lib/auth";

// POST - inicijaliziraj default nagrade
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const authCheck = await checkOwnerOrAdmin(token);
        if (!authCheck) {
            return NextResponse.json({ error: "Nemate dozvolu za ovu akciju" }, { status: 403 });
        }

        // Provjeri da li već postoje nagrade
        const existingRewards = await prisma.loyaltyReward.count();
        if (existingRewards > 0) {
            return NextResponse.json({ message: "Nagrade već postoje", count: existingRewards });
        }

        // Kreiraj default nagrade
        const defaultRewards = [
            {
                name: "Popust 10%",
                description: "Iskoristi 100 bodova za 10% popusta na sljedeću uslugu",
                pointsCost: 100,
                discount: 10,
                isActive: true,
            },
            {
                name: "Popust 15%",
                description: "Iskoristi 200 bodova za 15% popusta na sljedeću uslugu",
                pointsCost: 200,
                discount: 15,
                isActive: true,
            },
            {
                name: "Popust 20%",
                description: "Iskoristi 300 bodova za 20% popusta na sljedeću uslugu",
                pointsCost: 300,
                discount: 20,
                isActive: true,
            },
        ];

        const createdRewards = await Promise.all(
            defaultRewards.map((reward) =>
                prisma.loyaltyReward.create({
                    data: reward,
                })
            )
        );

        return NextResponse.json({
            message: "Default nagrade kreirane",
            rewards: createdRewards,
        });
    } catch (error) {
        console.error("POST /admin/loyalty/init-rewards error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

