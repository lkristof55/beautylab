import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

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

// DELETE - obriši sve invite kodove
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

    // Obriši sve invite kodove
    await prisma.inviteCode.deleteMany({});

    return NextResponse.json({ 
      message: "Svi invite kodovi su obrisani",
      deleted: true 
    });
  } catch (error) {
    console.error("DELETE invite codes error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

