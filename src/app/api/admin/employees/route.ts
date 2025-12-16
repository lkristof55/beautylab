import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkOwnerOrAdmin } from "@/lib/auth";

// GET - lista svih zaposlenika
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

        const employees = await prisma.employee.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { appointments: true }
                }
            }
        });

        return NextResponse.json({ employees });
    } catch (error) {
        console.error("GET /admin/employees error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

// POST - kreiranje novog zaposlenika
export async function POST(req: Request) {
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

        const { name, email, phone } = await req.json();

        if (!name || !email) {
            return NextResponse.json({ error: "Ime i email su obavezni" }, { status: 400 });
        }

        // Provjeri da email već ne postoji
        const existing = await prisma.employee.findUnique({
            where: { email: email.trim().toLowerCase() }
        });

        if (existing) {
            return NextResponse.json({ error: "Zaposlenik s ovim emailom već postoji" }, { status: 400 });
        }

        const employee = await prisma.employee.create({
            data: {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone?.trim() || null,
                isActive: true,
            },
        });

        return NextResponse.json({ employee, message: "Zaposlenik uspješno kreiran" }, { status: 201 });
    } catch (error) {
        console.error("POST /admin/employees error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

// PUT - ažuriranje zaposlenika
export async function PUT(req: Request) {
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

        const { id, name, email, phone, isActive } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ID zaposlenika je obavezan" }, { status: 400 });
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                name: name?.trim(),
                email: email?.trim().toLowerCase(),
                phone: phone?.trim() || null,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json({ employee, message: "Zaposlenik uspješno ažuriran" });
    } catch (error) {
        console.error("PUT /admin/employees error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

// DELETE - deaktivacija zaposlenika
export async function DELETE(req: Request) {
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

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID zaposlenika je obavezan" }, { status: 400 });
        }

        // Umjesto brisanja, deaktiviraj zaposlenika
        const employee = await prisma.employee.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ employee, message: "Zaposlenik uspješno deaktiviran" });
    } catch (error) {
        console.error("DELETE /admin/employees error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}





