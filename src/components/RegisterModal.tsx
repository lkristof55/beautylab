"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterModal({
    open,
    onClose,
    onRegisterSuccess,
    onSwitchToLogin
}: {
    open: boolean;
    onClose: () => void;
    onRegisterSuccess?: () => void;
    onSwitchToLogin?: () => void;
}) {
    const [form, setForm] = useState({ name: "", email: "", password: "", inviteCode: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        // Resetiraj custom validity kada korisnik počne tipkati
        e.target.setCustomValidity("");
    };

    // Custom validacijske poruke za HTML5 validaciju
    const handleNameInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
        if (e.target.validity.valueMissing) {
            e.target.setCustomValidity("Ime i prezime je obavezno");
        } else {
            e.target.setCustomValidity("Ime mora imati najmanje 2 znaka");
        }
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
        } else if (e.target.validity.tooShort) {
            e.target.setCustomValidity("Lozinka mora imati najmanje 8 znakova");
        } else if (e.target.validity.patternMismatch) {
            e.target.setCustomValidity("Lozinka mora sadržavati najmanje jedno veliko slovo, jedno malo slovo i jedan broj");
        } else {
            e.target.setCustomValidity("Lozinka ne zadovoljava zahtjeve");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        // Client-side validacija
        if (form.name.trim().length < 2) {
            setMessage("❌ Ime mora imati najmanje 2 znaka");
            setLoading(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email.trim())) {
            setMessage("❌ Neispravan format email adrese");
            setLoading(false);
            return;
        }

        if (form.password.length < 8) {
            setMessage("❌ Lozinka mora imati najmanje 8 znakova");
            setLoading(false);
            return;
        }

        if (!/[A-Z]/.test(form.password)) {
            setMessage("❌ Lozinka mora sadržavati najmanje jedno veliko slovo");
            setLoading(false);
            return;
        }

        if (!/[a-z]/.test(form.password)) {
            setMessage("❌ Lozinka mora sadržavati najmanje jedno malo slovo");
            setLoading(false);
            return;
        }

        if (!/\d/.test(form.password)) {
            setMessage("❌ Lozinka mora sadržavati najmanje jedan broj");
            setLoading(false);
            return;
        }

        if (!form.inviteCode.trim()) {
            setMessage("❌ Invite code je obavezan");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    inviteCode: form.inviteCode.trim().toUpperCase(),
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage("✅ Registracija uspješna!");
                setForm({ name: "", email: "", password: "", inviteCode: "" });
                
                // Zatvori modal i pozovi callback
                setTimeout(() => {
                    onClose();
                    if (onRegisterSuccess) {
                        onRegisterSuccess();
                    }
                }, 1000);
            } else {
                setMessage(`❌ ${data.error || "Greška pri registraciji"}`);
            }
        } catch (error) {
            console.error("Register error:", error);
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
                        Dobrodošla u Beauty Lab 💅
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
                        <label className="booking-label">Ime i prezime</label>
                        <input
                            name="name"
                            placeholder="Irena Horvat"
                            value={form.name}
                            onChange={handleChange}
                            onInvalid={handleNameInvalid}
                            onInput={handleChange}
                            className="booking-input"
                            required
                            minLength={2}
                        />
                    </div>

                    <div className="booking-field">
                        <label className="booking-label">Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="irena@beautylab.hr"
                            value={form.email}
                            onChange={handleChange}
                            onInvalid={handleEmailInvalid}
                            onInput={handleChange}
                            className="booking-input"
                            required
                        />
                    </div>

                    <div className="booking-field">
                        <label className="booking-label">Lozinka</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            onInvalid={handlePasswordInvalid}
                            onInput={handleChange}
                            className="booking-input"
                            required
                            minLength={8}
                            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
                        />
                        <p style={{ 
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-on-surface-secondary)",
                            marginTop: "var(--spacing-xs)"
                        }}>
                            Minimalno 8 znakova, mora sadržavati veliko slovo, malo slovo i broj
                        </p>
                    </div>

                    <div className="booking-field">
                        <label className="booking-label">Pozivni Kod</label>
                        <input
                            name="inviteCode"
                            placeholder="BEAUTY-XXXX"
                            value={form.inviteCode}
                            onChange={(e) => {
                                const upperValue = e.target.value.toUpperCase();
                                setForm({ ...form, inviteCode: upperValue });
                                e.target.setCustomValidity("");
                            }}
                            className="booking-input"
                            required
                            style={{ textTransform: "uppercase", fontFamily: "monospace" }}
                        />
                        <p style={{ 
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-on-surface-secondary)",
                            marginTop: "var(--spacing-xs)"
                        }}>
                            Registracija je moguća samo uz validan invite code
                        </p>
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
                            {loading ? "Registracija..." : "Registriraj se"}
                        </button>
                    </div>
                </form>

                <p style={{ 
                    textAlign: "center", 
                    marginTop: "var(--spacing-md)",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-on-surface-secondary)"
                }}>
                    Već imaš račun?{" "}
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            if (onSwitchToLogin) {
                                setTimeout(() => onSwitchToLogin(), 300);
                            }
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
                        Prijavi se
                    </button>
                </p>
            </div>
        </div>
    );
}

