"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function BookingSection() {
    const { user } = useAuth();
    const router = useRouter();

    const handleBookingClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            // Ako nije prijavljen, postavi flag i otvori login modal
            if (typeof window !== "undefined") {
                sessionStorage.setItem("clickedReserve", "true");
                if ((window as any).openLoginModal) {
                    (window as any).openLoginModal();
                }
            }
        } else {
            // Ako je prijavljen, idi na dashboard
            router.push("/dashboard");
        }
    };
    return (
        <section id="booking" className="booking-section">
            <div className="booking-container">
                {/* Lijeva strana, naslov i intro */}
                <div className="booking-intro">
                    <h2 id="booking-onboarding-title" className="section-title">
                        Kako rezervirati?
                    </h2>
                    <p className="section-content">
                        Rezerviraj u tri klika, dođi i uživaj.
                    </p>
                </div>

                {/* Sredina, koraci */}
                <div className="booking-steps">
                    <ol aria-label="Koraci procesa rezervacije" className="steps-list">
                        <li className="step-card">
                            <div className="step-number">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <g
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M8 2v4m8-4v4"></path>
                                        <rect x="3" y="4" rx="2" width="18" height="18"></rect>
                                        <path d="M3 10h18"></path>
                                    </g>
                                </svg>
                                <span>01</span>
                            </div>
                            <div className="step-content">
                                <h3 className="step-title">Odaberi uslugu</h3>
                                <p className="step-description">
                                    Manikura, Pedikura, Depilacija. Odaberi potpisni
                                    tretman ili prilagođenu kombinaciju koju je pripremila Irena.
                                </p>
                            </div>
                        </li>

                        <li className="step-card">
                            <div className="step-number">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <g
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 6v6l4 2"></path>
                                        <circle r="10" cx="12" cy="12"></circle>
                                    </g>
                                </svg>
                                <span>02</span>
                            </div>
                            <div className="step-content">
                                <h3 className="step-title">Odaberi vrijeme</h3>
                                <p className="step-description">
                                    Dostupnost u stvarnom vremenu, trenutna potvrda. Jutro, podne
                                    ili večer, rezerviraj trenutak koji odgovara tvom ritmu.
                                </p>
                            </div>
                        </li>

                        <li className="step-card">
                            <div className="step-number">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M20 6L9 17l-5-5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    ></path>
                                </svg>
                                <span>03</span>
                            </div>
                            <div className="step-content">
                                <h3 className="step-title">Potvrdi rezervaciju</h3>
                                <p className="step-description">
                                    Pregledaj svoje podatke i potvrdi rezervaciju. 
                                    Tvoj termin je rezerviran u samo nekoliko trenutaka.
                                </p>
                            </div>
                        </li>
                    </ol>
                </div>

                {/* Desna strana, dodatne informacije */}
                <div className="booking-reinforcement">
                    <div className="reinforcement-content">
                        <p className="reinforcement-text">
                            Rafiniran, pojednostavljen put dizajniran za zahtjevne klijentice,
                            jasnoća, brzina i personalizirani luksuz.
                        </p>
                        <p className="reinforcement-tips">
                            Sve što ti treba za rezervaciju je nekoliko minuta. 
                            Odaberi svoju omiljenu uslugu i termin koji ti odgovara.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleBookingClick}
                        aria-label="Započni rezervaciju, tri klika"
                        className="btn booking-cta btn-primary"
                        style={{ width: '100%', cursor: 'pointer' }}
                    >
                        <span>Spremno u 3 klika</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
