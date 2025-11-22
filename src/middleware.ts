// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Middleware za buduće proširenje (npr. rate limiting, logging)
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
