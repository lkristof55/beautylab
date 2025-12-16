import jwt from "jsonwebtoken";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    console.error("JWT_SECRET nije definiran u environment varijablama");
}

export type Role = "OWNER" | "ADMIN" | "MODERATOR" | "CLIENT";

export interface DecodedToken {
  userId: string;
  email: string;
}

/**
 * Provjeri token i vrati dekodirani podatak
 */
export async function verifyToken(token: string): Promise<DecodedToken> {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET nije definiran");
  }
  const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
  return decoded;
}

/**
 * Provjeri da li korisnik ima dozvolu za određene role
 */
export async function checkRole(
  token: string,
  allowedRoles: Role[]
): Promise<{ user: any; decoded: DecodedToken } | null> {
  try {
    const decoded = await verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return null;
    }

    if (allowedRoles.includes(user.role as Role)) {
      return { user, decoded };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Provjeri da li je korisnik OWNER ili ADMIN
 */
export async function checkOwnerOrAdmin(
  token: string
): Promise<{ user: any; decoded: DecodedToken } | null> {
  return checkRole(token, ["OWNER", "ADMIN"]);
}

/**
 * Provjeri da li je korisnik OWNER, ADMIN ili MODERATOR
 */
export async function checkOwnerAdminOrModerator(
  token: string
): Promise<{ user: any; decoded: DecodedToken } | null> {
  return checkRole(token, ["OWNER", "ADMIN", "MODERATOR"]);
}

/**
 * Provjeri da li je korisnik OWNER
 */
export async function checkOwner(
  token: string
): Promise<{ user: any; decoded: DecodedToken } | null> {
  return checkRole(token, ["OWNER"]);
}

/**
 * Provjeri da li je korisnik OWNER, ADMIN ili MODERATOR (za admin operacije)
 * Vraća samo decoded token za jednostavniju upotrebu
 */
export async function checkAdmin(
  token: string
): Promise<DecodedToken | null> {
  const authCheck = await checkOwnerAdminOrModerator(token);
  if (!authCheck) {
    return null;
  }
  return authCheck.decoded;
}

