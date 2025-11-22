import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/validation";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function checkAdmin(token: string) {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    const adminEmail = "irena@beautylab.hr";
    if (!user || (!user.isAdmin && user.email !== adminEmail)) {
        return null;
    }
    return { decoded, user };
}

export async function PUT(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const adminCheck = await checkAdmin(token);
        if (!adminCheck) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Trenutna i nova lozinka su obavezne" },
                { status: 400 }
            );
        }

        // Provjeri trenutnu lozinku
        const isValid = await bcrypt.compare(currentPassword, adminCheck.user.password);
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
            where: { id: adminCheck.user.id },
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

