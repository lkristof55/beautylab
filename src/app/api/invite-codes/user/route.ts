import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// GET - dohvati invite kodove koje je user kreirao
export async function GET(req: Request) {
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

    // Dohvati invite kodove koje je user kreirao
    const inviteCodes = await prisma.inviteCode.findMany({
      where: { createdBy: user.id },
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
    console.error("GET user invite codes error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}

