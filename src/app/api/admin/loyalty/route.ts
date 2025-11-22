import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

// GET - dohvati sve korisnike s loyalty podacima
export async function GET(req: Request) {
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

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                loyaltyPoints: true,
                loyaltyTier: true,
                totalVisits: true,
                totalSpent: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error("GET /admin/loyalty error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST - ažuriraj bodove korisnika (admin)
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

        const { userId, points, description, type = "admin_adjust" } = await req.json();

        if (!userId || points === undefined) {
            return NextResponse.json({ error: "User ID and points required" }, { status: 400 });
        }

        // Ažuriraj bodove korisnika
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                loyaltyPoints: {
                    increment: points,
                },
            },
        });

        // Kreiraj transakciju
        await prisma.loyaltyTransaction.create({
            data: {
                userId: userId,
                points: points,
                type: type,
                description: description || `Admin prilagodba: ${points > 0 ? "+" : ""}${points} bodova`,
            },
        });

        // Ažuriraj tier ako je potrebno (koristi postavke)
        const newTier = await calculateTier(updatedUser.loyaltyPoints);
        if (newTier !== updatedUser.loyaltyTier) {
            await prisma.user.update({
                where: { id: userId },
                data: { loyaltyTier: newTier },
            });
        }

        return NextResponse.json({
            message: "Bodovi uspješno ažurirani",
            user: {
                loyaltyPoints: updatedUser.loyaltyPoints,
                loyaltyTier: newTier,
            },
        });
    } catch (error) {
        console.error("POST /admin/loyalty error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// Helper funkcija za izračun tier-a (koristi postavke)
async function calculateTier(points: number): Promise<string> {
    const { getSettings, calculateTierFromSettings } = await import("@/lib/settings");
    const settings = await getSettings();
    return calculateTierFromSettings(points, settings);
}

