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

        // Prikupi statistiku
        const totalUsers = await prisma.user.count();
        const totalAppointments = await prisma.appointment.count();
        const completedAppointments = await prisma.appointment.count({
            where: { isCompleted: true }
        });
        const totalLoyaltyPoints = await prisma.user.aggregate({
            _sum: { loyaltyPoints: true }
        });
        const totalSpent = await prisma.user.aggregate({
            _sum: { totalSpent: true }
        });

        const stats = {
            totalUsers,
            totalAppointments,
            completedAppointments,
            incompleteAppointments: totalAppointments - completedAppointments,
            totalLoyaltyPoints: totalLoyaltyPoints._sum.loyaltyPoints || 0,
            totalSpent: totalSpent._sum.totalSpent || 0,
            exportDate: new Date().toISOString()
        };

        // Formatiraj kao tekstualni izvještaj
        const report = `
STATISTIKA BEAUTY LAB
=====================
Datum izvoza: ${new Date().toLocaleString('hr-HR')}

KORISNICI:
- Ukupno korisnika: ${stats.totalUsers}

REZERVACIJE:
- Ukupno rezervacija: ${stats.totalAppointments}
- Završene: ${stats.completedAppointments}
- Nedovršene: ${stats.incompleteAppointments}

LOYALTY PROGRAM:
- Ukupno bodova: ${stats.totalLoyaltyPoints}
- Ukupno potrošeno: ${stats.totalSpent.toFixed(2)} kn
        `.trim();

        return new NextResponse(report, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Disposition": `attachment; filename="statistika_${new Date().toISOString().split('T')[0]}.txt"`
            }
        });
    } catch (error: any) {
        console.error("Error exporting statistics:", error);
        return NextResponse.json(
            { error: "Greška pri exportu statistike" },
            { status: 500 }
        );
    }
}

