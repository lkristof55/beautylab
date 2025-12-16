import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET nije definiran u environment varijablama");
      return NextResponse.json(
        { error: "Greška konfiguracije servera" },
        { status: 500 }
      );
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token je obavezan" },
        { status: 400 }
      );
    }

    // Provjeri token (može biti istekao, ali još uvijek validan za refresh)
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as { userId: string; email: string };
    } catch (error) {
      return NextResponse.json(
        { error: "Nevažeći token" },
        { status: 401 }
      );
    }

    // Provjeri da korisnik još uvijek postoji
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen" },
        { status: 404 }
      );
    }

    // Generiraj novi token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      message: "Token osvježen",
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Greška pri osvježavanju tokena. Pokušajte ponovno." },
      { status: 500 }
    );
  }
}


