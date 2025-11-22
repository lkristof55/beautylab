import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Helper funkcija za provjeru admina
async function checkAdmin(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  const adminEmail = "irena@beautylab.hr";
  if (!user || (!user.isAdmin && user.email !== adminEmail)) {
    return null;
  }
  return decoded;
}

// GET - dohvati sve invite kodove
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const admin = await checkAdmin(token);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - generiraj novi invite code
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const admin = await checkAdmin(token);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
          createdBy: admin.userId,
        },
      });

      return NextResponse.json({ inviteCode }, { status: 201 });
    }

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        createdBy: admin.userId,
      },
    });

    return NextResponse.json({ inviteCode }, { status: 201 });
  } catch (error) {
    console.error("POST invite code error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE - obriši invite code
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const admin = await checkAdmin(token);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

