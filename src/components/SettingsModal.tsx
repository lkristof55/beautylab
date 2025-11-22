"use client";

import { useState, useEffect } from "react";
import { toast } from "./Toast";

interface Settings {
    id: string;
    emailNotificationsEnabled: boolean;
    emailNewAppointments: boolean;
    emailNewUsers: boolean;
    emailIncompleteAppointments: boolean;
    emailDailySummary: boolean;
    notificationEmail: string;
    workingDays: string;
    workingHoursStart: string;
    workingHoursEnd: string;
    breakStart: string | null;
    breakEnd: string | null;
    holidays: string | null;
    defaultPointsPerService: number;
    bronzeThreshold: number;
    silverThreshold: number;
    goldThreshold: number;
    platinumThreshold: number;
    inviteCodeBonusPoints: number;
    autoUpdateTiers: boolean;
    notificationRefreshInterval: number;
    showNewAppointmentNotifications: boolean;
    showTodayAppointmentNotifications: boolean;
    showNewUserNotifications: boolean;
    showIncompleteNotifications: boolean;
    notificationSoundEnabled: boolean;
    autoCompleteAppointments: boolean;
    autoCompleteAfterHours: number | null;
    autoDeleteOldAppointments: boolean;
    autoDeleteAfterDays: number | null;
    autoSendReminderEmails: boolean;
    reminderEmailHoursBefore: number | null;
    theme: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
    timezone: string;
}

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("email");
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // Add animation state
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (open) {
            setIsAnimating(true);
            setLoading(true);
            fetchSettings();
        } else {
            setIsAnimating(false);
            setSettings(null);
            setLoading(true);
            setActiveTab("email");
        }
    }, [open]);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            const res = await fetch("/api/admin/settings", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            } else {
                console.error("Failed to fetch settings:", res.status);
                toast.error("Greška pri dohvaćanju postavki");
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Greška pri dohvaćanju postavki");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                toast.success("Postavke su uspješno spremljene");
            } else {
                toast.error("Greška pri spremanju postavki");
            }
        } catch (error) {
            toast.error("Greška pri spremanju postavki");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("Nove lozinke se ne podudaraju");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            toast.error("Lozinka mora imati najmanje 8 znakova");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/admin/change-password", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            if (res.ok) {
                toast.success("Lozinka je uspješno promijenjena");
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const data = await res.json();
                toast.error(data.error || "Greška pri promjeni lozinke");
            }
        } catch (error) {
            toast.error("Greška pri promjeni lozinke");
        } finally {
            setSaving(false);
        }
    };

    const handleExport = async (type: "users" | "appointments" | "statistics") => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`/api/admin/export/${type}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || `${type}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success("Export uspješan");
            } else {
                toast.error("Greška pri exportu");
            }
        } catch (error) {
            toast.error("Greška pri exportu");
        }
    };

    
    if (!open) return null;

    const tabs = [
        { id: "email", label: "📧 Email Notifikacije" },
        { id: "working", label: "🕐 Radno Vrijeme" },
        { id: "loyalty", label: "🎁 Loyalty" },
        { id: "notifications", label: "🔔 Notifikacije" },
        { id: "automation", label: "⚙️ Automatizacija" },
        { id: "export", label: "📥 Export" },
        { id: "security", label: "🔒 Sigurnost" },
        { id: "general", label: "🌐 Općenito" }
    ];

    const workingDaysList = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const workingDaysLabels: { [key: string]: string } = {
        monday: "Ponedjeljak",
        tuesday: "Utorak",
        wednesday: "Srijeda",
        thursday: "Četvrtak",
        friday: "Petak",
        saturday: "Subota",
        sunday: "Nedjelja"
    };

    const parseWorkingDays = (daysJson: string): string[] => {
        try {
            return JSON.parse(daysJson);
        } catch {
            return ["monday", "tuesday", "wednesday", "thursday", "friday"];
        }
    };

    const toggleWorkingDay = (day: string) => {
        if (!settings) return;
        const currentDays = parseWorkingDays(settings.workingDays);
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        setSettings({ ...settings, workingDays: JSON.stringify(newDays) });
    };


    return (
        <div
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: "2rem",
                animation: isAnimating ? "fadeIn 0.3s ease-out" : "none",
            }}
        >
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(30px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes tabSlide {
                    from {
                        transform: translateX(-10px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}} />
            
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "white",
                    borderRadius: "24px",
                    width: "95vw",
                    maxWidth: "1400px",
                    height: "85vh",
                    maxHeight: "850px",
                    display: "grid",
                    gridTemplateColumns: "280px 1fr",
                    gridTemplateRows: "1fr auto",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                    overflow: "hidden",
                    animation: isAnimating ? "slideUp 0.4s ease-out" : "none",
                }}
            >
                {/* Sidebar with tabs */}
                <div style={{
                    background: "linear-gradient(135deg, #FDF7F7 0%, #FFF 100%)",
                    borderRight: "1px solid #E5E5E5",
                    padding: "2rem 0",
                    display: "flex",
                    flexDirection: "column",
                    gridColumn: "1",
                    gridRow: "1 / -1",
                    overflow: "hidden",
                }}>
                    <div style={{ padding: "0 2rem", marginBottom: "2rem" }}>
                        <h2 style={{ 
                            margin: 0, 
                            fontSize: "1.75rem", 
                            fontWeight: 700,
                            color: "var(--graphite)",
                            marginBottom: "0.5rem"
                        }}>
                            ⚙️ Postavke
                        </h2>
                        <p style={{ 
                            margin: 0, 
                            fontSize: "0.875rem", 
                            color: "var(--graphite)",
                            opacity: 0.6 
                        }}>
                            Upravljanje aplikacijom
                        </p>
                    </div>

                    <div style={{ 
                        flex: 1, 
                        overflowY: "auto",
                        padding: "0 1rem"
                    }}>
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    width: "100%",
                                    padding: "1rem 1.25rem",
                                    marginBottom: "0.5rem",
                                    border: "none",
                                    borderRadius: "12px",
                                    background: activeTab === tab.id 
                                        ? "linear-gradient(135deg, var(--rose) 0%, #e07e9e 100%)" 
                                        : "transparent",
                                    color: activeTab === tab.id ? "white" : "var(--graphite)",
                                    cursor: "pointer",
                                    fontSize: "0.95rem",
                                    fontWeight: activeTab === tab.id ? 600 : 500,
                                    textAlign: "left",
                                    transition: "all 0.3s ease",
                                    transform: activeTab === tab.id ? "translateX(4px)" : "translateX(0)",
                                    boxShadow: activeTab === tab.id 
                                        ? "0 4px 12px rgba(224, 126, 158, 0.3)" 
                                        : "none",
                                    animation: `tabSlide 0.3s ease-out ${index * 0.05}s both`,
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.background = "rgba(224, 126, 158, 0.1)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.background = "transparent";
                                    }
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ 
                        padding: "1.5rem 2rem", 
                        borderTop: "1px solid #E5E5E5" 
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                background: "transparent",
                                border: "1px solid #E5E5E5",
                                borderRadius: "10px",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                color: "var(--graphite)",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#F5F5F5";
                                e.currentTarget.style.borderColor = "#D0D0D0";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.borderColor = "#E5E5E5";
                            }}
                        >
                            ✕ Zatvori
                        </button>
                    </div>
                </div>

                {/* Main content area */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    gridColumn: "2",
                    gridRow: "1",
                }}>
                    {/* Content */}
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "2.5rem",
                        background: "#FAFAFA",
                        minHeight: 0,
                    }}>
                        {loading || !settings ? (
                            <div style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                height: "100%",
                                flexDirection: "column",
                                gap: "1rem"
                            }}>
                                <div style={{
                                    width: "48px",
                                    height: "48px",
                                    border: "4px solid var(--rose)",
                                    borderTopColor: "transparent",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite"
                                }}></div>
                                <p style={{ color: "var(--graphite)", opacity: 0.7 }}>
                                    Učitavanje postavki...
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                background: "white",
                                borderRadius: "16px",
                                padding: "2rem",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                animation: "fadeIn 0.3s ease-out"
                            }}>
                                {/* All existing tab content here - same as before */}
                                {/* Email, Working Hours, Loyalty, etc. */}
                                {activeTab === "email" && (
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Email Notifikacije</h3>
                            
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.emailNotificationsEnabled}
                                        onChange={(e) => setSettings({ ...settings, emailNotificationsEnabled: e.target.checked })}
                                    />
                                    <span>Omogući email notifikacije</span>
                                </label>
                            </div>

                            {settings.emailNotificationsEnabled && (
                                <>
                                    <div style={{ marginBottom: "1rem" }}>
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                            Email adresa za notifikacije
                                        </label>
                                        <input
                                            type="email"
                                            value={settings.notificationEmail}
                                            onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "0.5rem",
                                                border: "1px solid #ddd",
                                                borderRadius: "0.25rem"
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <input
                                                type="checkbox"
                                                checked={settings.emailNewAppointments}
                                                onChange={(e) => setSettings({ ...settings, emailNewAppointments: e.target.checked })}
                                            />
                                            <span>Nove rezervacije</span>
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <input
                                                type="checkbox"
                                                checked={settings.emailNewUsers}
                                                onChange={(e) => setSettings({ ...settings, emailNewUsers: e.target.checked })}
                                            />
                                            <span>Novi korisnici</span>
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <input
                                                type="checkbox"
                                                checked={settings.emailIncompleteAppointments}
                                                onChange={(e) => setSettings({ ...settings, emailIncompleteAppointments: e.target.checked })}
                                            />
                                            <span>Nedovršeni termini (reminder)</span>
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <input
                                                type="checkbox"
                                                checked={settings.emailDailySummary}
                                                onChange={(e) => setSettings({ ...settings, emailDailySummary: e.target.checked })}
                                            />
                                            <span>Dnevni sažetak</span>
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Working Hours */}
                    {activeTab === "working" && (
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Radno Vrijeme</h3>
                            
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Radni dani
                                </label>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    {workingDaysList.map(day => (
                                        <label key={day} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <input
                                                type="checkbox"
                                                checked={parseWorkingDays(settings.workingDays).includes(day)}
                                                onChange={() => toggleWorkingDay(day)}
                                            />
                                            <span>{workingDaysLabels[day]}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                        Početak radnog vremena
                                    </label>
                                    <input
                                        type="time"
                                        value={settings.workingHoursStart}
                                        onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "0.5rem",
                                            border: "1px solid #ddd",
                                            borderRadius: "0.25rem"
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                        Kraj radnog vremena
                                    </label>
                                    <input
                                        type="time"
                                        value={settings.workingHoursEnd}
                                        onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "0.5rem",
                                            border: "1px solid #ddd",
                                            borderRadius: "0.25rem"
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                        Početak pauze (opcionalno)
                                    </label>
                                    <input
                                        type="time"
                                        value={settings.breakStart || ""}
                                        onChange={(e) => setSettings({ ...settings, breakStart: e.target.value || null })}
                                        style={{
                                            width: "100%",
                                            padding: "0.5rem",
                                            border: "1px solid #ddd",
                                            borderRadius: "0.25rem"
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                        Kraj pauze (opcionalno)
                                    </label>
                                    <input
                                        type="time"
                                        value={settings.breakEnd || ""}
                                        onChange={(e) => setSettings({ ...settings, breakEnd: e.target.value || null })}
                                        style={{
                                            width: "100%",
                                            padding: "0.5rem",
                                            border: "1px solid #ddd",
                                            borderRadius: "0.25rem"
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loyalty */}
                    {activeTab === "loyalty" && (
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Loyalty Program</h3>
                            
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Default bodovi po usluzi
                                </label>
                                <input
                                    type="number"
                                    value={settings.defaultPointsPerService}
                                    onChange={(e) => setSettings({ ...settings, defaultPointsPerService: parseInt(e.target.value) || 0 })}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Bonus bodovi za invite kodove
                                </label>
                                <input
                                    type="number"
                                    value={settings.inviteCodeBonusPoints}
                                    onChange={(e) => setSettings({ ...settings, inviteCodeBonusPoints: parseInt(e.target.value) || 0 })}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <h4 style={{ marginBottom: "0.75rem" }}>Pragovi za tierove</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                            Bronze
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.bronzeThreshold}
                                            onChange={(e) => setSettings({ ...settings, bronzeThreshold: parseInt(e.target.value) || 0 })}
                                            style={{
                                                width: "100%",
                                                padding: "0.5rem",
                                                border: "1px solid #ddd",
                                                borderRadius: "0.25rem"
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                            Silver
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.silverThreshold}
                                            onChange={(e) => setSettings({ ...settings, silverThreshold: parseInt(e.target.value) || 0 })}
                                            style={{
                                                width: "100%",
                                                padding: "0.5rem",
                                                border: "1px solid #ddd",
                                                borderRadius: "0.25rem"
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                            Gold
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.goldThreshold}
                                            onChange={(e) => setSettings({ ...settings, goldThreshold: parseInt(e.target.value) || 0 })}
                                            style={{
                                                width: "100%",
                                                padding: "0.5rem",
                                                border: "1px solid #ddd",
                                                borderRadius: "0.25rem"
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                            Platinum
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.platinumThreshold}
                                            onChange={(e) => setSettings({ ...settings, platinumThreshold: parseInt(e.target.value) || 0 })}
                                            style={{
                                                width: "100%",
                                                padding: "0.5rem",
                                                border: "1px solid #ddd",
                                                borderRadius: "0.25rem"
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <input
                                    type="checkbox"
                                    checked={settings.autoUpdateTiers}
                                    onChange={(e) => setSettings({ ...settings, autoUpdateTiers: e.target.checked })}
                                />
                                <span>Automatsko ažuriranje tierova</span>
                            </label>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === "notifications" && (
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Postavke Notifikacija</h3>
                            
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Interval osvježavanja (sekunde)
                                </label>
                                <input
                                    type="number"
                                    value={settings.notificationRefreshInterval}
                                    onChange={(e) => setSettings({ ...settings, notificationRefreshInterval: parseInt(e.target.value) || 30 })}
                                    min={5}
                                    max={300}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.showNewAppointmentNotifications}
                                        onChange={(e) => setSettings({ ...settings, showNewAppointmentNotifications: e.target.checked })}
                                    />
                                    <span>Prikaži notifikacije za nove rezervacije</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.showTodayAppointmentNotifications}
                                        onChange={(e) => setSettings({ ...settings, showTodayAppointmentNotifications: e.target.checked })}
                                    />
                                    <span>Prikaži notifikacije za današnje termine</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.showNewUserNotifications}
                                        onChange={(e) => setSettings({ ...settings, showNewUserNotifications: e.target.checked })}
                                    />
                                    <span>Prikaži notifikacije za nove korisnike</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.showIncompleteNotifications}
                                        onChange={(e) => setSettings({ ...settings, showIncompleteNotifications: e.target.checked })}
                                    />
                                    <span>Prikaži notifikacije za nedovršene termine</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.notificationSoundEnabled}
                                        onChange={(e) => setSettings({ ...settings, notificationSoundEnabled: e.target.checked })}
                                    />
                                    <span>Zvuk za nove notifikacije</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Automation */}
                    {activeTab === "automation" && (
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Automatske Akcije</h3>
                            
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.autoCompleteAppointments}
                                        onChange={(e) => setSettings({ ...settings, autoCompleteAppointments: e.target.checked })}
                                    />
                                    <span>Automatsko označavanje termina kao completed</span>
                                </label>
                                {settings.autoCompleteAppointments && (
                                    <div style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                            Nakon koliko sati (opcionalno)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.autoCompleteAfterHours || ""}
                                            onChange={(e) => setSettings({ ...settings, autoCompleteAfterHours: e.target.value ? parseInt(e.target.value) : null })}
                                            style={{
                                                width: "100%",
                                                padding: "0.5rem",
                                                border: "1px solid #ddd",
                                                borderRadius: "0.25rem"
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.autoDeleteOldAppointments}
                                        onChange={(e) => setSettings({ ...settings, autoDeleteOldAppointments: e.target.checked })}
                                    />
                                    <span>Automatsko brisanje starih termina</span>
                                </label>
                                {settings.autoDeleteOldAppointments && (
                                    <div style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                            Nakon koliko dana (opcionalno)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.autoDeleteAfterDays || ""}
                                            onChange={(e) => setSettings({ ...settings, autoDeleteAfterDays: e.target.value ? parseInt(e.target.value) : null })}
                                            style={{
                                                width: "100%",
                                                padding: "0.5rem",
                                                border: "1px solid #ddd",
                                                borderRadius: "0.25rem"
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.autoSendReminderEmails}
                                        onChange={(e) => setSettings({ ...settings, autoSendReminderEmails: e.target.checked })}
                                    />
                                    <span>Automatsko slanje reminder emaila</span>
                                </label>
                                {settings.autoSendReminderEmails && (
                                    <div style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                            Koliko sati prije termina (opcionalno)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.reminderEmailHoursBefore || ""}
                                            onChange={(e) => setSettings({ ...settings, reminderEmailHoursBefore: e.target.value ? parseInt(e.target.value) : null })}
                                            style={{
                                                width: "100%",
                                                padding: "0.5rem",
                                                border: "1px solid #ddd",
                                                borderRadius: "0.25rem"
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Export */}
                    {activeTab === "export" && (
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Export/Backup</h3>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <button
                                    onClick={() => handleExport("users")}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        background: "var(--beige)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "0.5rem",
                                        cursor: "pointer",
                                        fontWeight: 500
                                    }}
                                >
                                    📥 Export Korisnika (CSV)
                                </button>
                                <button
                                    onClick={() => handleExport("appointments")}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        background: "var(--beige)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "0.5rem",
                                        cursor: "pointer",
                                        fontWeight: 500
                                    }}
                                >
                                    📥 Export Rezervacija (CSV)
                                </button>
                                <button
                                    onClick={() => handleExport("statistics")}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        background: "var(--beige)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "0.5rem",
                                        cursor: "pointer",
                                        fontWeight: 500
                                    }}
                                >
                                    📥 Export Statistike (TXT)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Security */}
                    {activeTab === "security" && (
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Sigurnost</h3>
                            
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Trenutna lozinka
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Nova lozinka
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Potvrdi novu lozinku
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleChangePassword}
                                disabled={saving}
                                style={{
                                    padding: "0.75rem 1.5rem",
                                    background: "var(--beige)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "0.5rem",
                                    cursor: saving ? "not-allowed" : "pointer",
                                    fontWeight: 500,
                                    opacity: saving ? 0.6 : 1
                                }}
                            >
                                {saving ? "Spremanje..." : "Promijeni lozinku"}
                            </button>
                        </div>
                    )}

                    {/* General */}
                    {activeTab === "general" && (
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Općenito</h3>
                            
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Tema
                                </label>
                                <select
                                    value={settings.theme}
                                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                >
                                    <option value="light">Svijetla</option>
                                    <option value="dark">Tamna</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Jezik
                                </label>
                                <select
                                    value={settings.language}
                                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                >
                                    <option value="hr">Hrvatski</option>
                                    <option value="en">Engleski</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Format datuma
                                </label>
                                <input
                                    type="text"
                                    value={settings.dateFormat}
                                    onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                                    placeholder="DD.MM.YYYY"
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Format vremena
                                </label>
                                <select
                                    value={settings.timeFormat}
                                    onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                >
                                    <option value="24h">24 sata</option>
                                    <option value="12h">12 sati (AM/PM)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                    Vremenska zona
                                </label>
                                <input
                                    type="text"
                                    value={settings.timezone}
                                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                    placeholder="Europe/Zagreb"
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "0.25rem"
                                    }}
                                />
                            </div>
                        </div>
                    )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer with save button */}
                <div style={{
                    padding: "1.5rem 2.5rem",
                    borderTop: "1px solid #E5E5E5",
                    background: "white",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "1rem",
                    gridColumn: "2",
                    gridRow: "2",
                    flexShrink: 0,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "0.75rem 2rem",
                            background: "transparent",
                            border: "1px solid #E5E5E5",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                            fontWeight: 500,
                            color: "var(--graphite)",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#F5F5F5";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        Odustani
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: "0.75rem 2rem",
                            background: saving 
                                ? "#CCC" 
                                : "linear-gradient(135deg, var(--rose) 0%, #e07e9e 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            cursor: saving ? "not-allowed" : "pointer",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            boxShadow: saving 
                                ? "none" 
                                : "0 4px 12px rgba(224, 126, 158, 0.3)",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            if (!saving) {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 6px 16px rgba(224, 126, 158, 0.4)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!saving) {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(224, 126, 158, 0.3)";
                            }
                        }}
                    >
                        {saving ? "⏳ Spremanje..." : "�� Spremi postavke"}
                    </button>
                </div>
            </div>
        </div>
    );
}

