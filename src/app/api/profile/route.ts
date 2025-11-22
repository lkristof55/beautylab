import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isValidEmail, validatePassword, isValidName } from "@/lib/validation";

const JWT_SECRET = process.env.JWT_SECRET as string;

// GET - dohvati profil korisnika
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        totalVisits: true,
        totalSpent: true,
        inviteCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("❌ Token error:", error);
    return NextResponse.json({ error: "Nevažeći ili istekao token" }, { status: 401 });
  }
}

// PUT - ažuriraj profil korisnika
export async function PUT(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { name, email } = await req.json();

    if (!name && !email) {
      return NextResponse.json({ error: "Ime ili email su obavezni" }, { status: 400 });
    }

    const updateData: { name?: string; email?: string } = {};

    // Validiraj i ažuriraj ime ako je prisutno
    if (name) {
      if (!isValidName(name)) {
        return NextResponse.json(
          { error: "Ime mora imati najmanje 2 znaka i smije sadržavati samo slova, razmake, apostrofe i crtice" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    // Validiraj i ažuriraj email ako je prisutno
    if (email) {
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: "Neispravan format email adrese" },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Provjeri da email nije već zauzet (ako se mijenja)
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== decoded.userId) {
        return NextResponse.json(
          { error: "Email je već u upotrebi" },
          { status: 400 }
        );
      }

      updateData.email = normalizedEmail;
    }

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user, message: "Profil uspješno ažuriran" });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Nevažeći token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Greška pri ažuriranju profila" }, { status: 500 });
  }
}

// PATCH - promijeni lozinku
export async function PATCH(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Trenutna i nova lozinka su obavezne" },
        { status: 400 }
      );
    }

    // Validiraj novu lozinku
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
    }

    // Provjeri trenutnu lozinku
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Trenutna lozinka nije ispravna" }, { status: 400 });
    }

    // Hash nova lozinka
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Lozinka uspješno promijenjena" });
  } catch (error) {
    console.error("❌ Change password error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Nevažeći token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Greška pri promjeni lozinke" }, { status: 500 });
  }
}
