import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";

// Tajni ključ, obavezno dodaj u .env datoteku
const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: Request) {
  try {
    // Provjeri da li je JWT_SECRET postavljen
    if (!JWT_SECRET) {
      console.error("JWT_SECRET nije definiran u environment varijablama");
      return NextResponse.json(
        { error: "Greška konfiguracije servera" },
        { status: 500 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email i lozinka su obavezni" },
        { status: 400 }
      );
    }

    // Validiraj email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Neispravan format email adrese" },
        { status: 400 }
      );
    }

    // Normaliziraj email (trim i lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    // Pronađi korisnika po emailu
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return NextResponse.json(
        { error: "Korisnik s ovom email adresom nije pronađen" },
        { status: 404 }
      );
    }

    // Usporedi lozinke
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Neispravna lozinka" },
        { status: 401 }
      );
    }

    // Generiraj JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      message: "Prijava uspješna",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Nevažeći token" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Greška na serveru. Pokušajte ponovno." },
      { status: 500 }
    );
  }
}
