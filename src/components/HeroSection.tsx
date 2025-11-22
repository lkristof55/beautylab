"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import BookAppointmentModal from "./BookAppointmentModal";

export default function HeroSection() {
    const { user } = useAuth();
    const [showBookingModal, setShowBookingModal] = useState(false);

    const handleReserveClick = () => {
        if (!user) {
            // Ako nije prijavljen, postavi flag i otvori login modal
            if (typeof window !== "undefined") {
                sessionStorage.setItem("clickedReserve", "true");
                if ((window as any).openLoginModal) {
                    (window as any).openLoginModal();
                }
            }
        } else {
            // Ako je prijavljen, otvori booking modal
            setShowBookingModal(true);
        }
    };

    // Slušaj kada se korisnik prijavi i automatski otvori booking modal
    useEffect(() => {
        if (user && (window as any).shouldOpenBookingAfterLogin) {
            setShowBookingModal(true);
            delete (window as any).shouldOpenBookingAfterLogin;
        }
    }, [user]);

    return (
        <>
            <section className="hero-section">
                {/* Background Image */}
                <div
                    className="hero-background"
                    style={{
                        backgroundImage: "url('/images/salon-bg.jpg')",
                    }}
                />

                {/* Dark Overlay / Scrim */}
                <div className="hero-scrim" />

                {/* Hero Content */}
                <div className="hero-content">
                    <div className="glass-panel">
                        <h1 className="hero-title">Beauty Lab by Irena</h1>
                        <p className="hero-subtitle">
                            Beauty is the illumination of your soul
                        </p>
                        <p className="hero-intro">
                            Doživi svoj trenutak luksuza i mira. Dobrodošla u Beauty Lab by Irena.
                        </p>
                        <button
                            type="button"
                            aria-label="Rezerviraj termin"
                            className="btn btn-primary btn-lg"
                            onClick={handleReserveClick}
                        >
                            Rezerviraj termin
                        </button>
                    </div>
                </div>
            </section>

            {/* Booking Modal */}
            {showBookingModal && user && (
                <BookAppointmentModal
                    open={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    onSuccess={() => {
                        // Rezervacija uspješna - modal će se zatvoriti automatski
                    }}
                />
            )}
        </>
    );
}
