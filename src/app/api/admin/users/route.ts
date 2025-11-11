import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (user?.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, email: true, createdAt: true },
        });

        return NextResponse.json(users);
    } catch (err) {
        console.error("❌ Admin users error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
