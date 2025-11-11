// src/components/ClientLayout.tsx
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Stranice BEZ navbar/footer
  const isAuthPage = ["/login", "/register"].includes(pathname);
  const isDashboardPage = pathname.startsWith("/dashboard") || 
                          pathname.startsWith("/appointments") ||
                          pathname.startsWith("/admin");

  const hideNavAndFooter = isAuthPage || isDashboardPage;

  return (
    <>
      {!hideNavAndFooter && (
        <header className="fixed inset-x-0 top-0 z-50 bg-white/90 backdrop-blur border-b">
          <Navbar />
        </header>
      )}

      <main className={!hideNavAndFooter ? "pt-24 pb-16 min-h-screen" : "min-h-screen"}>
        {children}
      </main>

      {!hideNavAndFooter && <Footer />}
    </>
  );
}
