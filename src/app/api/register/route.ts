import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isValidEmail, validatePassword, isValidName } from "@/lib/validation";
import { getSettings, calculateTierFromSettings } from "@/lib/settings";

export async function POST(req: Request) {
  try {
    const { name, email, password, inviteCode } = await req.json();

    // Provjeri da su sva polja prisutna
    if (!name || !email || !password || !inviteCode) {
      return NextResponse.json(
        { error: "Sva polja su obavezna (ime, email, lozinka, invite code)" },
        { status: 400 }
      );
    }

    // Validiraj invite code
    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    const validInviteCode = await prisma.inviteCode.findUnique({
      where: { code: normalizedInviteCode },
    });

    if (!validInviteCode) {
      return NextResponse.json(
        { error: "Nevažeći invite code" },
        { status: 400 }
      );
    }

    // Provjeri da invite code nije već korišten
    if (validInviteCode.usedBy) {
      return NextResponse.json(
        { error: "Ovaj invite code je već korišten" },
        { status: 400 }
      );
    }

    // Validiraj ime
    if (!isValidName(name)) {
      return NextResponse.json(
        { error: "Ime mora imati najmanje 2 znaka i smije sadržavati samo slova, razmake, apostrofe i crtice" },
        { status: 400 }
      );
    }

    // Validiraj email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Neispravan format email adrese" },
        { status: 400 }
      );
    }

    // Validiraj lozinku
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
        { status: 400 }
      );
    }

    // Provjeri da korisnik već ne postoji
    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Korisnik s ovom email adresom već postoji" },
        { status: 400 }
      );
    }

    // Hash lozinku
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kreiraj korisnika
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        inviteCode: normalizedInviteCode,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Označi invite code kao korišten
    await prisma.inviteCode.update({
      where: { id: validInviteCode.id },
      data: { usedBy: user.id },
    });

    // Dodaj loyalty bodove korisniku koji je kreirao invite code (koristi postavke)
    if (validInviteCode.createdBy) {
      const settings = await getSettings();
      const bonusPoints = settings.inviteCodeBonusPoints;
      
      const creator = await prisma.user.findUnique({
        where: { id: validInviteCode.createdBy },
      });

      if (creator) {
        // Ažuriraj bodove
        const updatedCreator = await prisma.user.update({
          where: { id: validInviteCode.createdBy },
          data: {
            loyaltyPoints: {
              increment: bonusPoints,
            },
          },
        });

        // Kreiraj transakciju
        await prisma.loyaltyTransaction.create({
          data: {
            userId: validInviteCode.createdBy,
            points: bonusPoints,
            type: "bonus",
            description: `Bonus za poziv prijatelja (${user.name} se registrirao s kodom ${normalizedInviteCode})`,
          },
        });

        // Ažuriraj tier ako je potrebno (koristi postavke)
        if (settings.autoUpdateTiers) {
          const newTier = calculateTierFromSettings(updatedCreator.loyaltyPoints, settings);
          if (newTier !== updatedCreator.loyaltyTier) {
            await prisma.user.update({
              where: { id: validInviteCode.createdBy },
              data: { loyaltyTier: newTier },
            });
          }
        }
      }
    }

    return NextResponse.json(
      { message: "Registracija uspješna", user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register error:", error);
    
    // Prisma unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Korisnik s ovom email adresom već postoji" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Greška pri registraciji. Pokušajte ponovno." },
      { status: 500 }
    );
  }
}
