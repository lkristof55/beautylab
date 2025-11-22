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

        const appointments = await prisma.appointment.findMany({
            orderBy: { date: "desc" },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Konvertiraj u CSV format
        const headers = ["ID", "Datum", "Usluga", "Korisnik", "Email", "Neregistrirani korisnik", "Telefon", "Završeno", "Bodovi", "Datum kreiranja"];
        const rows = appointments.map(apt => [
            apt.id,
            apt.date.toISOString(),
            apt.service,
            apt.user?.name || apt.unregisteredName || "N/A",
            apt.user?.email || "N/A",
            apt.unregisteredName || "N/A",
            apt.unregisteredPhone || "N/A",
            apt.isCompleted ? "Da" : "Ne",
            apt.pointsEarned?.toString() || "0",
            apt.createdAt.toISOString()
        ]);

        const csv = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="rezervacije_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error: any) {
        console.error("Error exporting appointments:", error);
        return NextResponse.json(
            { error: "Greška pri exportu rezervacija" },
            { status: 500 }
        );
    }
}

