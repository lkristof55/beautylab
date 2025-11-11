// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  console.log("🧩 Middleware aktivan:", req.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
