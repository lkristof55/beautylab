"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
    title: "Beauty Lab by Irena",
    description: "Salon ljepote — manikura, pedikura, depilacija i edukacije.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // sve rute koje trebaju biti BEZ navbar/footera:
    const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/appointments");

    return (
        <html lang="hr">
        <body className="bg-porcelain font-body text-graphite">
        <Providers>
            {!isDashboard && (
                <header className="fixed inset-x-0 top-0 z-50 bg-white/90 backdrop-blur border-b">
                    <Navbar />
                </header>
            )}

            <main className={!isDashboard ? "pt-24 pb-16 min-h-screen" : "min-h-screen"}>
                {children}
            </main>

            {!isDashboard && <Footer />}
        </Providers>
        </body>
        </html>
    );
}
