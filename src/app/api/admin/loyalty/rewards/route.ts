import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

// GET - dohvati sve nagrade
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

        const rewards = await prisma.loyaltyReward.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ rewards });
    } catch (error) {
        console.error("GET /admin/loyalty/rewards error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST - kreiraj novu nagradu
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

        const { name, description, pointsCost, discount } = await req.json();

        if (!name || !pointsCost) {
            return NextResponse.json({ error: "Name and points cost required" }, { status: 400 });
        }

        const reward = await prisma.loyaltyReward.create({
            data: {
                name,
                description: description || "",
                pointsCost,
                discount: discount || null,
                isActive: true,
            },
        });

        return NextResponse.json({ reward, message: "Nagrada uspješno kreirana" });
    } catch (error) {
        console.error("POST /admin/loyalty/rewards error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// PUT - ažuriraj nagradu
export async function PUT(req: Request) {
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

        const { id, name, description, pointsCost, discount, isActive } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Reward ID required" }, { status: 400 });
        }

        const reward = await prisma.loyaltyReward.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(pointsCost !== undefined && { pointsCost }),
                ...(discount !== undefined && { discount }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json({ reward, message: "Nagrada uspješno ažurirana" });
    } catch (error) {
        console.error("PUT /admin/loyalty/rewards error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// DELETE - obriši nagradu
export async function DELETE(req: Request) {
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

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Reward ID required" }, { status: 400 });
        }

        await prisma.loyaltyReward.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Nagrada uspješno obrisana" });
    } catch (error) {
        console.error("DELETE /admin/loyalty/rewards error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

