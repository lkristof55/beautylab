import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Helper funkcija za provjeru admina
async function checkAdmin(token: string) {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    const adminEmail = "irena@beautylab.hr";
    if (!user || (!user.isAdmin && user.email !== adminEmail)) {
        return null;
    }
    return decoded;
}

// GET - Dohvati postavke
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

        // Provjeri postoji li postavke, ako ne kreiraj default
        let settings = await prisma.settings.findFirst();
        
        if (!settings) {
            settings = await prisma.settings.create({
                data: {}
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Greška pri dohvaćanju postavki" },
            { status: 500 }
        );
    }
}

// PUT - Ažuriraj postavke
export async function PUT(req: Request) {
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

        const body = await req.json();

        // Provjeri postoji li postavke
        let settings = await prisma.settings.findFirst();
        
        if (!settings) {
            settings = await prisma.settings.create({
                data: body
            });
        } else {
            settings = await prisma.settings.update({
                where: { id: settings.id },
                data: body
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { error: "Greška pri ažuriranju postavki" },
            { status: 500 }
        );
    }
}

