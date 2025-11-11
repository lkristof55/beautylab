"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../dashboard-styles.css"; // Import luxury styles

type Appointment = {
    id: string;
    service: string;
    date: string;
    status?: "BOOKED" | "CANCELLED" | "DONE";
};

export default function LuxuryDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState<{ name: string; email: string; createdAt: string } | null>(null);
    const [appts, setAppts] = useState<Appointment[]>([]);
    const router = useRouter();

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.replace("/login");
            return;
        }

        const run = async () => {
            try {
                const [r1, r2] = await Promise.all([
                    fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } }),
                    fetch("/api/appointments", { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                if (!r1.ok) throw new Error("Greška profila");
                const { user } = await r1.json();
                setMe(user);

                if (r2.ok) {
                    const data = await r2.json();
                    setAppts(data.appointments || []);
                } else {
                    setAppts([]);
                }
            } catch (e) {
                console.error(e);
                localStorage.removeItem("token");
                router.replace("/login");
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [router, token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
    };

    const handleCancel = async (id: string) => {
        if (!token) return;
        const sure = confirm("Želiš otkazati ovaj termin?");
        if (!sure) return;

        const res = await fetch("/api/appointments", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ appointmentId: id }),
        });

        if (res.ok) {
            setAppts((prev) => prev.filter((a) => a.id !== id));
        } else {
            const data = await res.json();
            alert(data.error || "Greška pri otkazivanju");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen" style={{ background: 'linear-gradient(135deg, #fdfbf7 0%, #f7f3ef 100%)' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!me) return null;

    const upcomingAppts = appts.filter(a => new Date(a.date) > new Date() && a.status !== "CANCELLED");
    const pastAppts = appts.filter(a => new Date(a.date) <= new Date() || a.status === "CANCELLED");
    const nextAppointment = upcomingAppts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    return (
        <div id="user-dashboard">
            <section className="appointments-section">
                <div className="appointments-container">
                    {/* Header */}
                    <header className="section-header" style={{ marginBottom: '2rem' }}>
                        <h1 className="section-title">
                            Dobrodošla, <span style={{ color: '#d4af37' }}>{me.name}</span> 💅
                        </h1>
                        <p className="section-subtitle">
                            {me.email} • Član od {new Date(me.createdAt).toLocaleDateString("hr-HR")}
                        </p>
                    </header>

                    {/* Quick Actions */}
                    <div style={{ maxWidth: '1200px', margin: '0 auto 3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => router.push("/appointments")}
                            className="btn btn-primary"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M3 10h18M8 2v4m8-4v4" />
                            </svg>
                            <span>Nova Rezervacija</span>
                        </button>
                        <button onClick={handleLogout} className="btn btn-outline">
                            Odjavi se
                        </button>
                    </div>

                    <div className="appointments-grid">
                        <div className="appointments-main">
                            {/* Next Appointment Featured */}
                            {nextAppointment ? (
                                <article className="appointment-featured">
                                    <div className="appointment-image-wrapper">
                                        <img
                                            src="https://images.pexels.com/photos/7755237/pexels-photo-7755237.jpeg?auto=compress&cs=tinysrgb&w=400"
                                            alt="Beauty salon appointment"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div className="appointment-image-overlay"></div>
                                    </div>
                                    <div className="appointment-content">
                                        <div className="appointment-header">
                                            <div>
                                                <h3 className="appointment-title">{nextAppointment.service}</h3>
                                                <p className="appointment-meta">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <path d="M12 6v6l4 2" />
                                                    </svg>
                                                    <span>
                                                        {new Date(nextAppointment.date).toLocaleDateString('hr-HR', {
                                                            weekday: 'long',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })} • {new Date(nextAppointment.date).toLocaleTimeString('hr-HR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                    </span>
                                                </p>
                                                <p className="appointment-location">Studio A • s Irenom</p>
                                            </div>
                                            <div className="status-pill confirmed">
                                                <span>Potvrđeno</span>
                                            </div>
                                        </div>
                                        <div className="appointment-actions">
                                            <button
                                                onClick={() => router.push("/appointments")}
                                                className="btn btn-primary btn-sm"
                                            >
                                                Upravljaj Terminima
                                            </button>
                                            <button
                                                onClick={() => handleCancel(nextAppointment.id)}
                                                className="btn btn-outline btn-sm"
                                            >
                                                Otkaži
                                            </button>
                                        </div>
                                        <p className="appointment-note">
                                            Otkazivanje besplatno do 24 sata prije termina
                                        </p>
                                    </div>
                                </article>
                            ) : (
                                <article className="appointment-featured">
                                    <div className="appointment-image-wrapper">
                                        <img
                                            src="https://images.pexels.com/photos/7755237/pexels-photo-7755237.jpeg?auto=compress&cs=tinysrgb&w=400"
                                            alt="Beauty salon"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div className="appointment-image-overlay"></div>
                                    </div>
                                    <div className="appointment-content">
                                        <div className="appointment-header">
                                            <div>
                                                <h3 className="appointment-title">Nemaš nadolazećih termina</h3>
                                                <p className="appointment-meta">
                                                    <span>Rezerviraj svoj sljedeći tretman u 3 klika</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="appointment-actions">
                                            <button
                                                onClick={() => router.push("/appointments")}
                                                className="btn btn-primary"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                                    <path d="M3 10h18M8 2v4m8-4v4" />
                                                </svg>
                                                <span>Rezerviraj Termin</span>
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            )}

                            {/* Upcoming Appointments List */}
                            {upcomingAppts.length > 1 && (
                                <div className="appointments-list">
                                    <h3 className="list-heading">Ostali Nadolazeći Termini</h3>
                                    {upcomingAppts.slice(1).map((a) => {
                                        const appointmentDate = new Date(a.date);
                                        const canCancel = appointmentDate.getTime() - Date.now() > 24 * 60 * 60 * 1000;

                                        return (
                                            <article key={a.id} className="appointment-card">
                                                <div className="appointment-card-date">
                                                    <span className="date-day">{appointmentDate.getDate()}</span>
                                                    <span className="date-month">
                                                        {appointmentDate.toLocaleString('hr-HR', { month: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="appointment-card-content">
                                                    <h4 className="appointment-card-title">{a.service}</h4>
                                                    <p className="appointment-card-meta">
                                                        {appointmentDate.toLocaleString('hr-HR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })} • Studio A
                                                    </p>
                                                    <p className="appointment-card-stylist">s Irenom</p>
                                                </div>
                                                <div className="appointment-card-status">
                                                    <div className="status-pill confirmed">
                                                        <span>Potvrđeno</span>
                                                    </div>
                                                    {canCancel && (
                                                        <button
                                                            onClick={() => handleCancel(a.id)}
                                                            className="btn btn-outline btn-sm"
                                                        >
                                                            Otkaži
                                                        </button>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="appointments-sidebar">
                            {/* Stats Card */}
                            <div className="recent-visits">
                                <h3 className="sidebar-heading">Tvoja Statistika</h3>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'rgba(248, 231, 231, 0.3)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(212, 175, 55, 0.2)'
                                    }}>
                                        <p style={{ fontSize: '0.875rem', color: '#6b6b6b', marginBottom: '0.25rem' }}>
                                            Nadolazeći termini
                                        </p>
                                        <p style={{ fontSize: '2rem', fontWeight: '700', color: '#d4af37' }}>
                                            {upcomingAppts.length}
                                        </p>
                                    </div>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(99, 102, 241, 0.2)'
                                    }}>
                                        <p style={{ fontSize: '0.875rem', color: '#6b6b6b', marginBottom: '0.25rem' }}>
                                            Završeno
                                        </p>
                                        <p style={{ fontSize: '2rem', fontWeight: '700', color: '#4f46e5' }}>
                                            {pastAppts.filter(a => a.status !== 'CANCELLED').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Visits */}
                            {pastAppts.length > 0 && (
                                <div className="recent-visits">
                                    <h3 className="sidebar-heading">Nedavni Posjeti</h3>
                                    {pastAppts.slice(0, 3).map((a) => {
                                        const visitDate = new Date(a.date);
                                        return (
                                            <article key={a.id} className="visit-card">
                                                <div className="visit-card-content">
                                                    <h4 className="visit-card-title">{a.service}</h4>
                                                    <p className="visit-card-meta">
                                                        {visitDate.toLocaleDateString('hr-HR', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })} • {visitDate.toLocaleTimeString('hr-HR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                    </p>
                                                    <div className="status-pill completed">
                                                        <span>{a.status === 'CANCELLED' ? 'Otkazano' : 'Završeno'}</span>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Policy Notice */}
                            <div className="policy-notice">
                                <p className="policy-text">
                                    Politika otkazivanja: Besplatno do 24 sata. Depoziti zadržani za kasna otkazivanja —
                                    automatski konvertirani u salon kredit.
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </div>
    );
}