import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkOwnerOrAdmin } from "@/lib/auth";

export async function GET(req: Request) {
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

        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, email: true, createdAt: true },
        });

        return NextResponse.json(users);
    } catch (err) {
        console.error("❌ Admin users error:", err);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}
