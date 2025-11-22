"use client";

import { useState, useEffect } from "react";
import { toast } from "./Toast";

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

export default function ProfileTab() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "" });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setFormData({ name: data.user.name, email: data.user.email });
            } else {
                toast.error("Greška pri dohvaćanju profila");
            }
        } catch (error) {
            toast.error("Greška pri dohvaćanju profila");
        } finally {
            setLoading(false);
        }
    };

    // Custom validacijske poruke za HTML5 validaciju
    const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, name: e.target.value });
        e.target.setCustomValidity("");
    };

    const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, email: e.target.value });
        e.target.setCustomValidity("");
    };

    const handleNameInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
        if (e.target.validity.valueMissing) {
            e.target.setCustomValidity("Ime je obavezno");
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

    const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordForm({ ...passwordForm, newPassword: e.target.value });
        e.target.setCustomValidity("");
    };

    const handlePasswordInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
        if (e.target.validity.valueMissing) {
            e.target.setCustomValidity("Nova lozinka je obavezna");
        } else if (e.target.validity.tooShort) {
            e.target.setCustomValidity("Lozinka mora imati najmanje 8 znakova");
        } else if (e.target.validity.patternMismatch) {
            e.target.setCustomValidity("Lozinka mora sadržavati najmanje jedno veliko slovo, jedno malo slovo i jedan broj");
        } else {
            e.target.setCustomValidity("Lozinka ne zadovoljava zahtjeve");
        }
    };

    const handleUpdateProfile = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            toast.warning("Ime i email su obavezni");
            return;
        }

        // Client-side validacija
        if (formData.name.trim().length < 2) {
            toast.warning("Ime mora imati najmanje 2 znaka");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            toast.warning("Neispravan format email adrese");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setEditing(false);
                toast.success("Profil uspješno ažuriran");
                // Ažuriraj localStorage
                localStorage.setItem("user", JSON.stringify(data.user));
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Greška pri ažuriranju profila");
            }
        } catch (error) {
            toast.error("Greška pri ažuriranju profila");
        }
    };

    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            toast.warning("Unesite trenutnu i novu lozinku");
            return;
        }

        // Client-side validacija lozinke
        if (passwordForm.newPassword.length < 8) {
            toast.warning("Lozinka mora imati najmanje 8 znakova");
            return;
        }

        if (!/[A-Z]/.test(passwordForm.newPassword)) {
            toast.warning("Lozinka mora sadržavati najmanje jedno veliko slovo");
            return;
        }

        if (!/[a-z]/.test(passwordForm.newPassword)) {
            toast.warning("Lozinka mora sadržavati najmanje jedno malo slovo");
            return;
        }

        if (!/\d/.test(passwordForm.newPassword)) {
            toast.warning("Lozinka mora sadržavati najmanje jedan broj");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.warning("Nove lozinke se ne podudaraju");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            if (res.ok) {
                toast.success("Lozinka uspješno promijenjena");
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setShowPasswordForm(false);
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Greška pri promjeni lozinke");
            }
        } catch (error) {
            toast.error("Greška pri promjeni lozinke");
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                <p>Učitavanje...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                <p>Greška pri učitavanju profila</p>
            </div>
        );
    }

    return (
        <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            padding: '2rem',
            maxWidth: '900px',
            margin: '0 auto',
            width: '100%'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: 700, 
                    margin: '0 0 0.5rem 0',
                    color: '#2b2b2b',
                    fontFamily: 'var(--font-family-heading)'
                }}>
                    Moj Profil
                </h2>
                <p style={{ 
                    margin: 0, 
                    fontSize: '0.9375rem', 
                    color: '#6e6e6e'
                }}>
                    Upravljajte svojim osobnim podacima i postavkama
                </p>
            </div>

            <div style={{ 
                flex: 1, 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                {/* Profile Avatar Card */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #c2a063 0%, #b88746 100%)",
                        borderRadius: "16px",
                        padding: "2rem",
                        color: "white",
                        boxShadow: "0 8px 24px rgba(194, 160, 99, 0.25)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                        <div style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.2)",
                            backdropFilter: "blur(10px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.75rem",
                            fontWeight: 700,
                            border: "3px solid rgba(255, 255, 255, 0.3)",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                        }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ 
                                fontSize: "1.5rem", 
                                fontWeight: 700, 
                                margin: "0 0 0.5rem 0",
                                textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                            }}>
                                {user.name}
                            </h3>
                            <p style={{ 
                                margin: 0, 
                                fontSize: "0.9375rem", 
                                opacity: 0.95,
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                            }}>
                                <span>✉️</span> {user.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "2rem",
                        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
                        border: "1px solid rgba(0, 0, 0, 0.04)",
                        transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.06)";
                        e.currentTarget.style.transform = "translateY(0)";
                    }}
                >
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        marginBottom: "2rem",
                        paddingBottom: "1.5rem",
                        borderBottom: "2px solid #f5f5f5"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ fontSize: "1.5rem" }}>👤</span>
                            <h3 style={{ fontSize: "1.375rem", fontWeight: 600, margin: 0, color: "#2b2b2b" }}>
                                Osobni podaci
                            </h3>
                        </div>
                        {!editing && (
                            <button 
                                className="btn btn-outline btn-sm" 
                                onClick={() => setEditing(true)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "0.625rem 1.25rem"
                                }}
                            >
                                <span>✏️</span> Uredi
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ 
                                    display: "block", 
                                    marginBottom: "0.75rem", 
                                    fontWeight: 600,
                                    fontSize: "0.9375rem",
                                    color: "#2b2b2b"
                                }}>
                                    Ime i prezime
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={handleNameInput}
                                    onInvalid={handleNameInvalid}
                                    onInput={handleNameInput}
                                    style={{
                                        width: "100%",
                                        padding: "0.875rem 1rem",
                                        border: "2px solid #e5e5e5",
                                        borderRadius: "10px",
                                        fontSize: "1rem",
                                        transition: "all 0.2s ease",
                                        background: "#fafafa"
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#c2a063";
                                        e.target.style.background = "white";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(194, 160, 99, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e5e5e5";
                                        e.target.style.background = "#fafafa";
                                        e.target.style.boxShadow = "none";
                                    }}
                                    required
                                    minLength={2}
                                />
                            </div>
                            <div>
                                <label style={{ 
                                    display: "block", 
                                    marginBottom: "0.75rem", 
                                    fontWeight: 600,
                                    fontSize: "0.9375rem",
                                    color: "#2b2b2b"
                                }}>
                                    Email adresa
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={handleEmailInput}
                                    onInvalid={handleEmailInvalid}
                                    onInput={handleEmailInput}
                                    style={{
                                        width: "100%",
                                        padding: "0.875rem 1rem",
                                        border: "2px solid #e5e5e5",
                                        borderRadius: "10px",
                                        fontSize: "1rem",
                                        transition: "all 0.2s ease",
                                        background: "#fafafa"
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#c2a063";
                                        e.target.style.background = "white";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(194, 160, 99, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e5e5e5";
                                        e.target.style.background = "#fafafa";
                                        e.target.style.boxShadow = "none";
                                    }}
                                    required
                                    pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                                />
                            </div>
                            <div style={{ 
                                display: "flex", 
                                gap: "0.75rem",
                                marginTop: "0.5rem",
                                paddingTop: "1.5rem",
                                borderTop: "2px solid #f5f5f5"
                            }}>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleUpdateProfile}
                                    style={{
                                        flex: 1,
                                        padding: "0.875rem 1.5rem",
                                        fontWeight: 600,
                                        fontSize: "1rem"
                                    }}
                                >
                                    💾 Spremi promjene
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setEditing(false);
                                        setFormData({ name: user.name, email: user.email });
                                    }}
                                    style={{
                                        padding: "0.875rem 1.5rem",
                                        fontWeight: 500
                                    }}
                                >
                                    Odustani
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                            <div style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "1rem",
                                padding: "1rem",
                                borderRadius: "12px",
                                background: "#fafafa",
                                transition: "background 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#fafafa"}
                            >
                                <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    background: "linear-gradient(135deg, #c2a063 0%, #b88746 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.25rem",
                                    flexShrink: 0
                                }}>
                                    👤
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: "0.8125rem", 
                                        color: "#6e6e6e",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        fontWeight: 600,
                                        marginBottom: "0.5rem"
                                    }}>
                                        Ime
                                    </p>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: "1.125rem", 
                                        fontWeight: 600,
                                        color: "#2b2b2b"
                                    }}>
                                        {user.name}
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "1rem",
                                padding: "1rem",
                                borderRadius: "12px",
                                background: "#fafafa",
                                transition: "background 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#fafafa"}
                            >
                                <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    background: "linear-gradient(135deg, #c2a063 0%, #b88746 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.25rem",
                                    flexShrink: 0
                                }}>
                                    ✉️
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: "0.8125rem", 
                                        color: "#6e6e6e",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        fontWeight: 600,
                                        marginBottom: "0.5rem"
                                    }}>
                                        Email adresa
                                    </p>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: "1.125rem", 
                                        fontWeight: 600,
                                        color: "#2b2b2b"
                                    }}>
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "1rem",
                                padding: "1rem",
                                borderRadius: "12px",
                                background: "#fafafa",
                                transition: "background 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#fafafa"}
                            >
                                <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    background: "linear-gradient(135deg, #c2a063 0%, #b88746 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.25rem",
                                    flexShrink: 0
                                }}>
                                    📅
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: "0.8125rem", 
                                        color: "#6e6e6e",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        fontWeight: 600,
                                        marginBottom: "0.5rem"
                                    }}>
                                        Član od
                                    </p>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: "1.125rem", 
                                        fontWeight: 600,
                                        color: "#2b2b2b"
                                    }}>
                                        {new Date(user.createdAt).toLocaleDateString("hr-HR", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Change Password */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "2rem",
                        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
                        border: "1px solid rgba(0, 0, 0, 0.04)",
                        transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.06)";
                        e.currentTarget.style.transform = "translateY(0)";
                    }}
                >
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        marginBottom: "2rem",
                        paddingBottom: "1.5rem",
                        borderBottom: "2px solid #f5f5f5"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ fontSize: "1.5rem" }}>🔒</span>
                            <h3 style={{ fontSize: "1.375rem", fontWeight: 600, margin: 0, color: "#2b2b2b" }}>
                                Promjena lozinke
                            </h3>
                        </div>
                        {!showPasswordForm && (
                            <button 
                                className="btn btn-outline btn-sm" 
                                onClick={() => setShowPasswordForm(true)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "0.625rem 1.25rem"
                                }}
                            >
                                <span>🔑</span> Promijeni lozinku
                            </button>
                        )}
                    </div>

                    {showPasswordForm && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ 
                                    display: "block", 
                                    marginBottom: "0.75rem", 
                                    fontWeight: 600,
                                    fontSize: "0.9375rem",
                                    color: "#2b2b2b"
                                }}>
                                    Trenutna lozinka
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) =>
                                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                                    }
                                    placeholder="Unesite trenutnu lozinku"
                                    style={{
                                        width: "100%",
                                        padding: "0.875rem 1rem",
                                        border: "2px solid #e5e5e5",
                                        borderRadius: "10px",
                                        fontSize: "1rem",
                                        transition: "all 0.2s ease",
                                        background: "#fafafa"
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#c2a063";
                                        e.target.style.background = "white";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(194, 160, 99, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e5e5e5";
                                        e.target.style.background = "#fafafa";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ 
                                    display: "block", 
                                    marginBottom: "0.75rem", 
                                    fontWeight: 600,
                                    fontSize: "0.9375rem",
                                    color: "#2b2b2b"
                                }}>
                                    Nova lozinka
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordInput}
                                    onInvalid={handlePasswordInvalid}
                                    onInput={handlePasswordInput}
                                    placeholder="Unesite novu lozinku"
                                    style={{
                                        width: "100%",
                                        padding: "0.875rem 1rem",
                                        border: "2px solid #e5e5e5",
                                        borderRadius: "10px",
                                        fontSize: "1rem",
                                        transition: "all 0.2s ease",
                                        background: "#fafafa"
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#c2a063";
                                        e.target.style.background = "white";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(194, 160, 99, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e5e5e5";
                                        e.target.style.background = "#fafafa";
                                        e.target.style.boxShadow = "none";
                                    }}
                                    required
                                    minLength={8}
                                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
                                />
                                <p style={{
                                    fontSize: "0.8125rem",
                                    color: "#6e6e6e",
                                    marginTop: "0.5rem",
                                    marginBottom: 0,
                                    lineHeight: 1.5
                                }}>
                                    ⚠️ Minimalno 8 znakova, mora sadržavati veliko slovo, malo slovo i broj
                                </p>
                            </div>
                            <div>
                                <label style={{ 
                                    display: "block", 
                                    marginBottom: "0.75rem", 
                                    fontWeight: 600,
                                    fontSize: "0.9375rem",
                                    color: "#2b2b2b"
                                }}>
                                    Potvrdi novu lozinku
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                                    }
                                    placeholder="Ponovno unesite novu lozinku"
                                    style={{
                                        width: "100%",
                                        padding: "0.875rem 1rem",
                                        border: "2px solid #e5e5e5",
                                        borderRadius: "10px",
                                        fontSize: "1rem",
                                        transition: "all 0.2s ease",
                                        background: "#fafafa"
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#c2a063";
                                        e.target.style.background = "white";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(194, 160, 99, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e5e5e5";
                                        e.target.style.background = "#fafafa";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            </div>
                            <div style={{ 
                                display: "flex", 
                                gap: "0.75rem",
                                marginTop: "0.5rem",
                                paddingTop: "1.5rem",
                                borderTop: "2px solid #f5f5f5"
                            }}>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleChangePassword}
                                    style={{
                                        flex: 1,
                                        padding: "0.875rem 1.5rem",
                                        fontWeight: 600,
                                        fontSize: "1rem"
                                    }}
                                >
                                    🔑 Spremi lozinku
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                    }}
                                    style={{
                                        padding: "0.875rem 1.5rem",
                                        fontWeight: 500
                                    }}
                                >
                                    Odustani
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

