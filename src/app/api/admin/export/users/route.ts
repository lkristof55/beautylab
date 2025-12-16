import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const admin = await checkAdmin(token);
        if (!admin) {
            return NextResponse.json({ error: "Nemate dozvolu za ovu akciju" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
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
            user.role === "OWNER" || user.role === "ADMIN" ? "Da" : "Ne",
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

