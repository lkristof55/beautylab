import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { checkOwnerOrAdmin } from "@/lib/auth";

// GET - dohvati sve invite kodove
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

    // Dohvati sve invite kodove (i admin i user kodove)
    const inviteCodes = await prisma.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Dohvati informacije o korisnicima koji su koristili kodove
    const codesWithUsers = await Promise.all(
      inviteCodes.map(async (code) => {
        let usedByUser = null;
        if (code.usedBy) {
          usedByUser = await prisma.user.findUnique({
            where: { id: code.usedBy },
            select: { id: true, name: true, email: true },
          });
        }
        return {
          ...code,
          usedByUser,
        };
      })
    );

    return NextResponse.json({ inviteCodes: codesWithUsers });
  } catch (error) {
    console.error("GET invite codes error:", error);
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}

// POST - generiraj novi invite code
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

    // Generiraj random kod (BEAUTY-XXXX)
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    const code = `BEAUTY-${randomPart}`;

    // Provjeri da kod ne postoji (vrlo malo vjerojatno, ali sigurno)
    const existing = await prisma.inviteCode.findUnique({
      where: { code },
    });

    if (existing) {
      // Ako postoji, generiraj novi
      const newRandomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
      const newCode = `BEAUTY-${newRandomPart}`;
      
      const inviteCode = await prisma.inviteCode.create({
        data: {
          code: newCode,
          createdBy: authCheck.decoded.userId,
        },
      });

      return NextResponse.json({ inviteCode }, { status: 201 });
    }

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        createdBy: authCheck.decoded.userId,
      },
    });

    return NextResponse.json({ inviteCode }, { status: 201 });
  } catch (error) {
    console.error("POST invite code error:", error);
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}

// DELETE - obriši invite code
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
      return NextResponse.json(
        { error: "Invite code ID je obavezan" },
        { status: 400 }
      );
    }

    // Provjeri da kod nije korišten
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { id },
    });

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code nije pronađen" },
        { status: 404 }
      );
    }

    if (inviteCode.usedBy) {
      return NextResponse.json(
        { error: "Ne možete obrisati već korišten invite code" },
        { status: 400 }
      );
    }

    await prisma.inviteCode.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Invite code obrisan" });
  } catch (error) {
    console.error("DELETE invite code error:", error);
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}

