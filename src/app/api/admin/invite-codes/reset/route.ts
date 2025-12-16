import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth";

// DELETE - obriši sve invite kodove
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const admin = await checkAdmin(token);
    if (!admin) {
      return NextResponse.json({ error: "Nemate dozvolu za ovu akciju" }, { status: 403 });
    }

    // Obriši sve invite kodove
    await prisma.inviteCode.deleteMany({});

    return NextResponse.json({ 
      message: "Svi invite kodovi su obrisani",
      deleted: true 
    });
  } catch (error) {
    console.error("DELETE invite codes error:", error);
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}

