import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function checkAdmin(token: string) {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    const adminEmail = "irena@beautylab.hr";
    if (!user || (!user.isAdmin && user.email !== adminEmail)) {
        return null;
    }
    return decoded;
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const admin = await checkAdmin(token);
        if (!admin) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                isAdmin: true,
                loyaltyPoints: true,
                loyaltyTier: true,
                totalVisits: true,
                totalSpent: true,
                createdAt: true
            }
        });

        // Konvertiraj u CSV format
        const headers = ["ID", "Ime", "Email", "Admin", "Loyalty Bodovi", "Tier", "Ukupno posjeta", "Ukupno potrošeno", "Datum registracije"];
        const rows = users.map(user => [
            user.id,
            user.name,
            user.email,
            user.isAdmin ? "Da" : "Ne",
            user.loyaltyPoints.toString(),
            user.loyaltyTier,
            user.totalVisits.toString(),
            user.totalSpent.toFixed(2),
            user.createdAt.toISOString()
        ]);

        const csv = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="korisnici_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error: any) {
        console.error("Error exporting users:", error);
        return NextResponse.json(
            { error: "Greška pri exportu korisnika" },
            { status: 500 }
        );
    }
}

