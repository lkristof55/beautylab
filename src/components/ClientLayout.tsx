// src/components/ClientLayout.tsx
"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import RegisterModal from "@/components/RegisterModal";
import ToastContainer from "@/components/Toast";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Stranice BEZ navbar/footer
  const isDashboardPage = pathname.startsWith("/dashboard") || 
                          pathname.startsWith("/admin");

  const hideNavAndFooter = isDashboardPage;

  // Postavi globalne funkcije za otvaranje modala
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).openLoginModal = () => setShowLoginModal(true);
      (window as any).openRegisterModal = () => setShowRegisterModal(true);
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).openLoginModal;
        delete (window as any).openRegisterModal;
      }
    };
  }, []);

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

      {/* Globalni modali */}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          // Postavi flag da treba otvoriti booking modal nakon prijave
          if (typeof window !== "undefined") {
            (window as any).shouldOpenBookingAfterLogin = true;
          }
        }}
      />

      <RegisterModal
        open={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegisterSuccess={() => {
          // Nakon registracije, otvori login modal
          setTimeout(() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }, 500);
        }}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />

      <ToastContainer />
    </>
  );
}
