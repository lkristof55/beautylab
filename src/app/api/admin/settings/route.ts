import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth";

// GET - Dohvati postavke
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
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const admin = await checkAdmin(token);
        if (!admin) {
            return NextResponse.json({ error: "Nemate dozvolu za ovu akciju" }, { status: 403 });
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

