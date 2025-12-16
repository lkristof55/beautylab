import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

// GET - dohvati bodove korisnika
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

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                loyaltyPoints: true,
                loyaltyTier: true,
                totalVisits: true,
                totalSpent: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("GET /loyalty/points error:", error);
        return NextResponse.json({ error: "Nevažeći ili istekao token" }, { status: 401 });
    }
}

