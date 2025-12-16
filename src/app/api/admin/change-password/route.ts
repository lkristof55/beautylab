import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/validation";
import { checkOwnerOrAdmin } from "@/lib/auth";

export async function PUT(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const adminCheck = await checkOwnerOrAdmin(token);
        if (!adminCheck) {
            return NextResponse.json({ error: "Nemate dozvolu za ovu akciju" }, { status: 403 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Trenutna i nova lozinka su obavezne" },
                { status: 400 }
            );
        }

        // Provjeri trenutnu lozinku
        const user = await prisma.user.findUnique({ where: { id: adminCheck.user.id } });
        if (!user) {
            return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
        }
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: "Trenutna lozinka nije ispravna" },
                { status: 400 }
            );
        }

        // Validiraj novu lozinku
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return NextResponse.json(
                { error: passwordValidation.errors.join(", ") },
                { status: 400 }
            );
        }

        // Hashiraj i spremi novu lozinku
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ message: "Lozinka je uspješno promijenjena" });
    } catch (error: any) {
        console.error("Error changing password:", error);
        return NextResponse.json(
            { error: "Greška pri promjeni lozinke" },
            { status: 500 }
        );
    }
}

