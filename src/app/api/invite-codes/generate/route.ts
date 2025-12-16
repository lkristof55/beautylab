import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET as string;

// POST - generiraj novi invite code za usera
export async function POST(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET nije definiran u environment varijablama");
      return NextResponse.json(
        { error: "Greška konfiguracije servera" },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });
    }

    // Generiraj kod na osnovu imena korisnika (IME-XXXX)
    const namePart = user.name
      .toUpperCase()
      .replace(/[^A-ZČĆĐŠŽ]/g, "") // Ukloni sve osim slova
      .substring(0, 3) // Prva 3 slova
      .padEnd(3, "X"); // Ako ima manje od 3 slova, dopuni s X
    
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
    const code = `${namePart}-${randomPart}`;

    // Provjeri da kod ne postoji
    const existing = await prisma.inviteCode.findUnique({
      where: { code },
    });

    if (existing) {
      // Ako postoji, generiraj novi s drugim random dijelom
      const newRandomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
      const newCode = `${namePart}-${newRandomPart}`;
      
      const inviteCode = await prisma.inviteCode.create({
        data: {
          code: newCode,
          createdBy: user.id,
        },
      });

      return NextResponse.json({ inviteCode }, { status: 201 });
    }

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ inviteCode }, { status: 201 });
  } catch (error) {
    console.error("POST user invite code error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Nevažeći token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}

