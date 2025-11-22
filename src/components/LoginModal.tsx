"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginModal({
    open,
    onClose,
    onLoginSuccess
}: {
    open: boolean;
    onClose: () => void;
    onLoginSuccess?: () => void;
}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    // Custom validacijske poruke za HTML5 validaciju
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        e.target.setCustomValidity("");
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        e.target.setCustomValidity("");
    };

    const handleEmailInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
        if (e.target.validity.valueMissing) {
            e.target.setCustomValidity("Email adresa je obavezna");
        } else if (e.target.validity.typeMismatch) {
            e.target.setCustomValidity("Unesite ispravan format email adrese (npr. ime@domena.hr)");
        } else {
            e.target.setCustomValidity("Neispravan format email adrese");
        }
    };

    const handlePasswordInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
        if (e.target.validity.valueMissing) {
            e.target.setCustomValidity("Lozinka je obavezna");
        } else {
            e.target.setCustomValidity("Lozinka je obavezna");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                login(data.user, data.token);
                setMessage("✅ Prijava uspješna!");
                
                // Postavi flag da treba otvoriti booking modal nakon prijave (ako je korisnik kliknuo "Rezerviraj termin")
                if (typeof window !== "undefined" && (window as any).shouldOpenBookingAfterLogin === undefined) {
                    // Provjeri je li korisnik kliknuo "Rezerviraj termin" prije prijave
                    const clickedReserve = sessionStorage.getItem("clickedReserve");
                    if (clickedReserve) {
                        (window as any).shouldOpenBookingAfterLogin = true;
                        sessionStorage.removeItem("clickedReserve");
                    }
                }
                
                // Zatvori modal i pozovi callback
                setTimeout(() => {
                    onClose();
                    if (onLoginSuccess) {
                        onLoginSuccess();
                    }
                }, 500);
            } else {
                setMessage(`❌ ${data.error || "Greška pri prijavi"}`);
            }
        } catch (error) {
            console.error("Login error:", error);
            setMessage("❌ Greška na serveru");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    // Handler za overlay - zatvori modal samo ako se klikne direktno na overlay
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Zatvori modal samo ako se klikne direktno na overlay (ne na modal ili njegov sadržaj)
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="booking-modal-overlay" onClick={handleOverlayClick}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                <div className="booking-modal-header">
                    <h2 style={{ 
                        fontSize: "var(--font-size-xl)", 
                        marginBottom: 0,
                        color: "var(--color-on-surface)",
                        fontFamily: "var(--font-family-heading)",
                        fontWeight: 700
                    }}>
                        Dobrodošla natrag 💅
                    </h2>
                    <button
                        onClick={onClose}
                        className="booking-modal-close"
                        aria-label="Zatvori"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="booking-modal-body">
                    {message && (
                        <div className={`booking-msg ${message.includes("❌") ? "error" : "success"}`}>
                            {message}
                        </div>
                    )}

                    <div className="booking-field">
                        <label className="booking-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="irena@beautylab.hr"
                            value={email}
                            onChange={handleEmailChange}
                            onInvalid={handleEmailInvalid}
                            onInput={handleEmailChange}
                            className="booking-input"
                            required
                        />
                    </div>

                    <div className="booking-field">
                        <label className="booking-label">Lozinka</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={handlePasswordChange}
                            onInvalid={handlePasswordInvalid}
                            onInput={handlePasswordChange}
                            className="booking-input"
                            required
                        />
                    </div>

                    <div className="booking-modal-footer" style={{ marginTop: "var(--spacing-lg)" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-outline"
                        >
                            Odustani
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? "Prijava..." : "Prijavi se"}
                        </button>
                    </div>
                </form>

                <p style={{ 
                    textAlign: "center", 
                    marginTop: "var(--spacing-md)",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-on-surface-secondary)"
                }}>
                    Nemaš račun?{" "}
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            setTimeout(() => {
                                if ((window as any).openRegisterModal) {
                                    (window as any).openRegisterModal();
                                }
                            }, 300);
                        }}
                        style={{ 
                            color: "var(--gold)", 
                            textDecoration: "none",
                            fontWeight: 500,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            fontFamily: "inherit",
                            fontSize: "inherit"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                    >
                        Registriraj se
                    </button>
                </p>
            </div>
        </div>
    );
}

