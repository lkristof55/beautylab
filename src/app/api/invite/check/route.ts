import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Invite code je obavezan" },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!inviteCode) {
      return NextResponse.json(
        { valid: false, error: "Nevažeći invite code" },
        { status: 200 }
      );
    }

    if (inviteCode.usedBy) {
      return NextResponse.json(
        { valid: false, error: "Ovaj invite code je već korišten" },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Check invite code error:", error);
    return NextResponse.json(
      { error: "Greška pri provjeri invite koda" },
      { status: 500 }
    );
  }
}

