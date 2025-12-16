"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import "../app/globals.css";

export default function Footer() {
    const { user } = useAuth();
    const router = useRouter();

    const handleReserveClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
        <footer id="footer" className="footer">
            <div className="footer__container">
                <div className="footer__brand">
                    <h3 className="footer__brand-title">Beauty Lab by Irena</h3>
                    <p className="footer__brand-tagline">
                        Tvoj novi omiljeni termin, u 3 klika.
                    </p>
                    <p className="footer__brand-description">
                        Doživi luksuzne usluge ljepote u elegantnom, intimnom okruženju.
                        Specijalizirane smo za manikuru, pedikuru i depilaciju.
                    </p>
                </div>

                <div className="footer__info-grid">
                    <div className="footer__info-block">
                        <h4 className="footer__info-title">Kontakt</h4>
                        <ul className="footer__info-list">
                            <li>
                                📞 +1 (234) 567-890
                            </li>
                            <li>
                                ✉️ hello@beautylabbyirena.com
                            </li>
                            <li>
                                📍 123 Beauty Street, New York, NY 10001
                            </li>
                        </ul>
                    </div>

                    <div className="footer__info-block">
                        <h4 className="footer__info-title">Radno Vrijeme</h4>
                        <ul className="footer__info-list">
                            <li>Ponedjeljak - Petak: 9:00 - 19:00</li>
                            <li>Subota: 10:00 - 18:00</li>
                            <li>Nedjelja: Zatvoreno</li>
                        </ul>
                    </div>

                    <div className="footer__info-block">
                        <h4 className="footer__info-title">Usluge</h4>
                        <ul className="footer__info-list">
                            <li>Manikura</li>
                            <li>Pedikura</li>
                            <li>Depilacija</li>
                        </ul>
                    </div>

                    <div className="footer__info-block">
                        <h4 className="footer__info-title">Brzi Linkovi</h4>
                        <ul className="footer__info-list">
                            <li><a href="/">Početna</a></li>
                            <li><a href="/dashboard" onClick={handleReserveClick}>Rezerviraj Termin</a></li>
                            <li><a href="/radovi">Naš Rad</a></li>
                            <li><a href="/about">O Nama</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer__divider"></div>

                <div className="footer__bottom">
                    <div className="footer__social">
                        <span className="footer__social-label">Prati nas</span>
                        <div className="footer__social-links">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noreferrer noopener"
                                className="footer__social-link"
                            >
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noreferrer noopener"
                                className="footer__social-link"
                            >
                                <i className="fab fa-facebook-f"></i>
                            </a>
                        </div>
                    </div>

                    <div className="footer__copyright">
                        <p>© 2025 Beauty Lab by Irena. Sva prava pridržana.</p>
                        <div className="footer__legal-links">
                            <a href="/privacy">Pravila Privatnosti</a>
                            <span>|</span>
                            <a href="/terms">Uvjeti Korištenja</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
