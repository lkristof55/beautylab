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

        const totalUsers = await prisma.user.count();
        const totalAppointments = await prisma.appointment.count();

        const topService = await prisma.appointment.groupBy({
            by: ["service"],
            _count: { service: true },
            orderBy: { _count: { service: "desc" } },
            take: 1,
        });

        return NextResponse.json({
            totalUsers,
            totalAppointments,
            topService: topService[0]?.service || "Nema podataka",
        });
    } catch (err) {
        console.error("❌ Admin stats error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
