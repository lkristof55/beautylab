"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "./dashboard-styles.css";

type Appointment = {
    id: string;
    service: string;
    date: string;
    status?: string;
    userId?: string;
};

export default function UserDashboard() {
    const [activeTab, setActiveTab] = useState("appointments");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState("");
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetchAppointments();
        generateInviteCode();
    }, [router]);

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/appointments", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setAppointments(data.appointments || []);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateInviteCode = () => {
        // Generate user-specific invite code
        if (user?.name) {
            const code = `${user.name.toUpperCase().substring(0, 3)}${Math.floor(Math.random() * 10000)}`;
            setInviteCode(code);
        }
    };

    const cancelAppointment = async (id: string) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/api/appointments`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ appointmentId: id }),
            });

            if (res.ok) {
                setAppointments(prev => prev.filter(a => a.id !== id));
                alert("Termin uspješno otkazan!");
            }
        } catch (error) {
            console.error("Error canceling appointment:", error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.getDate(),
            month: date.toLocaleString("hr-HR", { month: "short" }).toUpperCase(),
            time: date.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }),
            full: date.toLocaleDateString("hr-HR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
        };
    };

    const upcomingAppointments = appointments
        .filter(a => new Date(a.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastAppointments = appointments
        .filter(a => new Date(a.date) <= new Date())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Kopirano u međuspremnik!");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Učitavanje...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="user-dashboard-container">
            <Navbar />

            <main className="user-dashboard-main">
                <div className="dashboard-container">
                    {/* Tab Navigation */}
                    <div className="tab-navigation">
                        <button
                            className={`tab-button ${activeTab === "appointments" ? "active" : ""}`}
                            onClick={() => handleTabClick("appointments")}
                            aria-selected={activeTab === "appointments"}
                        >
                            Moji Termini
                        </button>
                        <button
                            className={`tab-button ${activeTab === "loyalty" ? "active" : ""}`}
                            onClick={() => handleTabClick("loyalty")}
                            aria-selected={activeTab === "loyalty"}
                        >
                            Loyalty & Kuponi
                        </button>
                        <button
                            className={`tab-button ${activeTab === "invite" ? "active" : ""}`}
                            onClick={() => handleTabClick("invite")}
                            aria-selected={activeTab === "invite"}
                        >
                            Pozovi Prijatelje
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content-wrapper">
                        {/* My Appointments Tab */}
                        {activeTab === "appointments" && (
                            <div className="tab-panel appointments-panel active">
                                <header className="panel-header">
                                    <h2 className="panel-title">Moji Termini</h2>
                                    <p className="panel-subtitle">
                                        Nadolazeće rezervacije i nedavne posjete — elegantno organizirane
                                    </p>
                                    <a href="/appointments" className="btn btn-primary btn-sm" style={{marginTop: "1rem"}}>
                                        + Nova rezervacija
                                    </a>
                                </header>

                                <div className="appointments-content">
                                    {/* Upcoming Appointments */}
                                    <div className="appointments-upcoming">
                                        <h3 className="section-label">Nadolazeći termini</h3>

                                        {upcomingAppointments.length > 0 ? (
                                            <>
                                                {/* Featured First Appointment */}
                                                {upcomingAppointments[0] && (
                                                    <article className="appointment-featured">
                                                        <div className="appointment-featured-image">
                                                            <div className="status-badge confirmed">Potvrđeno</div>
                                                        </div>
                                                        <div className="appointment-featured-content">
                                                            <h4 className="appointment-title">{upcomingAppointments[0].service}</h4>
                                                            <div className="appointment-meta">
                                                                <span className="appointment-date">
                                                                    {formatDate(upcomingAppointments[0].date).full}
                                                                </span>
                                                                <span className="appointment-location">
                                                                    Studio A • sa Irenom
                                                                </span>
                                                            </div>
                                                            <div className="appointment-actions">
                                                                <button
                                                                    className="btn btn-outline"
                                                                    onClick={() => cancelAppointment(upcomingAppointments[0].id)}
                                                                >
                                                                    Otkaži
                                                                </button>
                                                            </div>
                                                            <p className="appointment-note">
                                                                Otkazivanje moguće do 24h prije termina
                                                            </p>
                                                        </div>
                                                    </article>
                                                )}

                                                {/* Other Appointments */}
                                                <div className="appointments-list">
                                                    {upcomingAppointments.slice(1).map((appointment) => {
                                                        const dateInfo = formatDate(appointment.date);
                                                        return (
                                                            <article key={appointment.id} className="appointment-card">
                                                                <div className="appointment-date-box">
                                                                    <span className="date-day">{dateInfo.day}</span>
                                                                    <span className="date-month">{dateInfo.month}</span>
                                                                </div>
                                                                <div className="appointment-info">
                                                                    <h4 className="appointment-name">{appointment.service}</h4>
                                                                    <p className="appointment-time">
                                                                        {dateInfo.time} • Studio A
                                                                    </p>
                                                                    <p className="appointment-staff">sa Irenom</p>
                                                                </div>
                                                                <div className="appointment-status">
                                                                    <span className="status-badge confirmed">Potvrđeno</span>
                                                                    <button
                                                                        className="btn-link"
                                                                        onClick={() => cancelAppointment(appointment.id)}
                                                                    >
                                                                        Otkaži
                                                                    </button>
                                                                </div>
                                                            </article>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500 mb-4">Nemate nadolazećih termina</p>
                                                <a href="/appointments" className="btn btn-primary">
                                                    Rezerviraj termin
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recent Visits */}
                                    <div className="appointments-recent">
                                        <h3 className="section-label">Nedavne posjete</h3>

                                        <div className="visits-list">
                                            {pastAppointments.slice(0, 5).map((appointment) => {
                                                const dateInfo = formatDate(appointment.date);
                                                return (
                                                    <article key={appointment.id} className="visit-card">
                                                        <div className="visit-info">
                                                            <h4 className="visit-name">{appointment.service}</h4>
                                                            <p className="visit-date">{dateInfo.full}</p>
                                                            <span className="status-badge completed">Završeno</span>
                                                        </div>
                                                        <div className="visit-actions">
                                                            <button className="btn btn-outline btn-sm">
                                                                Ocijeni
                                                            </button>
                                                            <button className="btn-link">Ponovi</button>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                            {pastAppointments.length === 0 && (
                                                <p className="text-gray-500">Još nemate završenih termina</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loyalty & Coupons Tab */}
                        {activeTab === "loyalty" && (
                            <div className="tab-panel loyalty-panel active">
                                <header className="panel-header">
                                    <h2 className="panel-title">Loyalty bodovi</h2>
                                    <p className="panel-subtitle">
                                        Vaša elegancija, nagrađena. Zaradite 1 bod za svaki €1 potrošen.
                                    </p>
                                </header>

                                <div className="loyalty-content">
                                    <div className="loyalty-main">
                                        <div className="points-balance-card">
                                            <div className="points-display">
                                                <span className="points-number">238</span>
                                                <span className="points-label">Dostupnih bodova</span>
                                            </div>

                                            <div className="points-progress">
                                                <div className="progress-info">
                                                    <span>238 bodova</span>
                                                    <span>300 bodova za €15</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div className="progress-fill" style={{ width: "79%" }}></div>
                                                </div>
                                                <p className="progress-remaining">
                                                    Još 62 boda do sljedeće nagrade
                                                </p>
                                            </div>

                                            <div className="earning-ways">
                                                <h3 className="subsection-title">Načini zarađivanja</h3>
                                                <ul className="earning-list">
                                                    <li>✓ Rezerviraj termine</li>
                                                    <li>✓ Pozovi prijatelje</li>
                                                    <li>✓ Rođendanski bonus</li>
                                                    <li>✓ Nagrade za redovitost</li>
                                                </ul>
                                            </div>

                                            <div className="redemption-section">
                                                <h3 className="subsection-title">Iskoristi bodove</h3>
                                                <p className="redemption-text">
                                                    Pretvori bodove u kupone i koristi ih pri plaćanju.
                                                </p>
                                                <div className="redemption-buttons">
                                                    <button className="btn btn-primary">50 bodova → €5</button>
                                                    <button className="btn btn-primary">120 bodova → €15</button>
                                                    <button className="btn btn-outline">Prilagođeno</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="coupons-sidebar">
                                        <h3 className="sidebar-title">Dostupni kuponi</h3>
                                        <p className="sidebar-text">
                                            Vaši aktivni kuponi su navedeni ispod. Kliknite za korištenje.
                                        </p>

                                        <div className="coupons-list">
                                            <article className="coupon-card">
                                                <div className="coupon-icon">🎁</div>
                                                <div className="coupon-details">
                                                    <h4 className="coupon-title">€5 popusta</h4>
                                                    <p className="coupon-description">50 bodova</p>
                                                    <p className="coupon-code">BLAB5</p>
                                                    <p className="coupon-expiry">Ističe: 15.04.2026</p>
                                                </div>
                                                <div className="coupon-actions">
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => copyToClipboard("BLAB5")}
                                                    >
                                                        Kopiraj
                                                    </button>
                                                </div>
                                            </article>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Invite Friends Tab */}
                        {activeTab === 'invite' && (
                            <div className="tab-panel invite-panel active">
                                <div className="invite-content">
                                    <div className="invite-hero">
                                        <h2 className="invite-title">Pozovi prijatelje i zaradi</h2>
                                        <p className="invite-subtitle">
                                            Podijeli svoj kod i oboje dobivate €5 popusta!
                                        </p>
                                        <div className="invite-code-section">
                                            <span className="code-label">VAŠ POZIVNI KOD</span>
                                            <div className="code-display">{inviteCode}</div>
                                            <div className="code-actions">
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => {
                                                        const text = `Pridruži mi se u Beauty Lab! Koristi moj kod ${inviteCode} za €5 popusta na prvi termin!`;
                                                        if (navigator.share) {
                                                            navigator.share({ text });
                                                        } else {
                                                            copyToClipboard(text);
                                                        }
                                                    }}
                                                >
                                                    <span>📤</span> Podijeli
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    onClick={() => copyToClipboard(inviteCode)}
                                                >
                                                    <span>📋</span> Kopiraj kod
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="invite-body">
                                        <div className="how-it-works">
                                            <h3 className="section-title">Kako funkcionira?</h3>
                                            <ol className="steps-list">
                                                <li className="step-item">
                                                    <span className="step-number">1</span>
                                                    <div className="step-content">
                                                        <h4>Podijeli svoj kod</h4>
                                                        <p>Pošalji svoj jedinstveni kod prijateljima</p>
                                                    </div>
                                                </li>
                                                <li className="step-item">
                                                    <span className="step-number">2</span>
                                                    <div className="step-content">
                                                        <h4>Oni rezerviraju</h4>
                                                        <p>Koriste tvoj kod pri prvoj rezervaciji</p>
                                                    </div>
                                                </li>
                                                <li className="step-item">
                                                    <span className="step-number">3</span>
                                                    <div className="step-content">
                                                        <h4>Oboje dobivate nagradu</h4>
                                                        <p>€5 popusta za oboje!</p>
                                                    </div>
                                                </li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}