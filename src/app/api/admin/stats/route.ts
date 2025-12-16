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
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}
