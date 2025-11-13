"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import "./dashboard-styles.css";
import BookAppointmentSidebar from "./components/booking.tsx";


type Appointment = {
    id: string;
    service: string;
    date: string;
    status?: string;
    userId?: string;
    user?: { name: string; email: string };
};

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

interface Stats {
    totalAppointments: number;
    totalUsers: number;
    topService: string;
}

interface ServiceCount {
    service: string;
    count: number;
}

export default function DashboardPage() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState("appointments");
    const [adminTab, setAdminTab] = useState("calendar");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState("");

    const [showBooking, setShowBooking] = useState(false);

    const router = useRouter();
    const { user } = useAuth();

    // Admin states
    const [adminAppointments, setAdminAppointments] = useState<Appointment[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            router.push("/login");
            return;
        }

        const parsedUser = JSON.parse(userData);

        // Check if admin
        const adminEmail = 'irena@beautylab.hr';
        const isUserAdmin = parsedUser.email === adminEmail || parsedUser.isAdmin;
        setIsAdmin(isUserAdmin);

        if (isUserAdmin) {
            // Admin logic
            fetchAdminData();
        } else {
            // User logic
            fetchAppointments();
            generateInviteCode();
        }

        setLoading(false);
    }, [router]);

    // Admin functions
    const fetchAdminData = async () => {
        await Promise.all([
            fetchAdminAppointments(),
            fetchUsers(),
            fetchStats()
        ]);
    };

    const fetchAdminAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/appointments', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setAdminAppointments(data);
            }
        } catch (err) {
            console.error('Error fetching admin appointments:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    // User functions
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
        }
    };

    const generateInviteCode = () => {
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Kopirano u međuspremnik!");
    };

    // Admin specific functions
    const getServiceBreakdown = (): ServiceCount[] => {
        const serviceMap = new Map<string, number>();
        adminAppointments.forEach(apt => {
            const count = serviceMap.get(apt.service) || 0;
            serviceMap.set(apt.service, count + 1);
        });
        return Array.from(serviceMap, ([service, count]) => ({ service, count }))
            .sort((a, b) => b.count - a.count);
    };

    const getTodayCount = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return adminAppointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= today && aptDate < tomorrow;
        }).length;
    };

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Convert appointments to FullCalendar events
    const calendarEvents = adminAppointments.map(apt => ({
        id: apt.id,
        title: `${apt.service} - ${apt.user?.name || 'N/A'}`,
        start: apt.date,
        backgroundColor: '#e07e9e',
        borderColor: '#d49ca3',
        textColor: '#fff'
    }));

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

    // ADMIN DASHBOARD
    if (isAdmin) {
        return (
            <div style={{
                display: 'flex',
                minHeight: '100vh',
                background: 'var(--porcelain)',
                position: 'relative'
            }}>
                {/* Fixed Sidebar */}
                <aside style={{
                    width: '260px',
                    background: 'white',
                    borderRight: '1px solid var(--beige)',
                    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '2rem 1.5rem',
                        borderBottom: '1px solid var(--beige)'
                    }}>
                        <h2 className="panel-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                            Admin Panel 💅
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--graphite)', opacity: 0.7 }}>
                            Beauty Lab by Irena
                        </p>
                    </div>

                    <nav style={{ padding: '1rem', flex: 1 }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => setAdminTab('calendar')}
                                    className={`tab-button ${adminTab === 'calendar' ? 'active' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.875rem 1rem',
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.3s',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        background: adminTab === 'calendar' ? 'var(--rose)' : 'transparent',
                                        color: adminTab === 'calendar' ? 'white' : 'var(--graphite)',
                                        border: 'none',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>📅</span>
                                    <span style={{ fontWeight: '500' }}>Termini</span>
                                </button>
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => setAdminTab('users')}
                                    className={`tab-button ${adminTab === 'users' ? 'active' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.875rem 1rem',
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.3s',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        background: adminTab === 'users' ? 'var(--rose)' : 'transparent',
                                        color: adminTab === 'users' ? 'white' : 'var(--graphite)',
                                        border: 'none',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>👩‍💻</span>
                                    <span style={{ fontWeight: '500' }}>Korisnice</span>
                                </button>
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => setAdminTab('stats')}
                                    className={`tab-button ${adminTab === 'stats' ? 'active' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.875rem 1rem',
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.3s',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        background: adminTab === 'stats' ? 'var(--rose)' : 'transparent',
                                        color: adminTab === 'stats' ? 'white' : 'var(--graphite)',
                                        border: 'none',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>📊</span>
                                    <span style={{ fontWeight: '500' }}>Statistika</span>
                                </button>
                            </li>
                        </ul>

                        <div style={{
                            borderTop: '1px solid var(--beige)',
                            marginTop: '2rem',
                            paddingTop: '2rem'
                        }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="btn-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.875rem 1rem',
                                            borderRadius: '0.75rem',
                                            transition: 'all 0.3s',
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            color: 'var(--graphite)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.25rem' }}>🚪</span>
                                        <span style={{ fontWeight: '500' }}>Odjava</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    {user && (
                        <div style={{
                            padding: '1.5rem',
                            borderTop: '1px solid var(--beige)',
                            background: 'var(--porcelain)',
                            marginTop: 'auto'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    background: 'var(--rose)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1.125rem'
                                }}>
                                    {user.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <p style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        color: 'var(--graphite)',
                                        margin: 0
                                    }}>
                                        {user.name || 'Admin'}
                                    </p>
                                    <p style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--graphite)',
                                        opacity: 0.7,
                                        margin: 0
                                    }}>
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main style={{
                    marginLeft: '260px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh'
                }}>
                    <div style={{
                        background: 'white',
                        borderBottom: '1px solid var(--beige)',
                        padding: '1.5rem 2rem',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h1 style={{
                                    fontSize: '1.5rem',
                                    marginBottom: '0.25rem',
                                    fontWeight: '600',
                                    color: 'var(--graphite)'
                                }}>
                                    {adminTab === 'calendar' && '📅 Kalendar termina'}
                                    {adminTab === 'users' && '👩‍💻 Upravljanje korisnicima'}
                                    {adminTab === 'stats' && '📊 Statistika i analitika'}
                                </h1>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.875rem',
                                    color: 'var(--graphite)',
                                    opacity: 0.7
                                }}>
                                    {new Date().toLocaleDateString('hr-HR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    className="btn btn-outline btn-sm"
                                    style={{ position: 'relative' }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>🔔</span>
                                    <span style={{
                                        position: 'absolute',
                                        top: '-0.25rem',
                                        right: '-0.25rem',
                                        background: 'var(--rose)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        3
                                    </span>
                                </button>
                                <button className="btn btn-outline btn-sm">
                                    <span style={{ fontSize: '1.25rem' }}>⚙️</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        padding: '1rem'
                    }}>
                        {/* Calendar Tab with FullCalendar */}
                        {adminTab === 'calendar' && (
                            <div style={{
                                padding: '2rem',
                                background: 'white',
                                borderRadius: '1rem',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <h2 style={{
                                    marginBottom: '2rem',
                                    fontSize: '1.5rem',
                                    color: 'var(--graphite)'
                                }}>
                                    Svi termini
                                </h2>
                                <div style={{ flex: 1 }}>
                                    <FullCalendar
                                        plugins={[dayGridPlugin, interactionPlugin]}
                                        initialView="dayGridMonth"
                                        headerToolbar={{
                                            left: 'prev,next today',
                                            center: 'title',
                                            right: 'dayGridMonth,dayGridWeek,dayGridDay'
                                        }}
                                        events={calendarEvents}
                                        eventClick={(info) => {
                                            alert(`Termin: ${info.event.title}\nDatum: ${info.event.start?.toLocaleString('hr-HR')}`);
                                        }}
                                        locale='hr'
                                        height="auto"
                                        dayMaxEvents={3}
                                        eventDisplay='block'
                                        eventColor='#e07e9e'
                                    />
                                </div>

                                {/* Lista termina ispod kalendara */}
                                <div style={{
                                    marginTop: '2rem',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    borderTop: '1px solid var(--beige)',
                                    paddingTop: '1rem'
                                }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                                        Lista termina
                                    </h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                        <tr style={{ borderBottom: '2px solid var(--beige)' }}>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>Datum</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>Vrijeme</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>Usluga</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>Korisnik</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {adminAppointments.slice(0, 5).map((apt) => (
                                            <tr key={apt.id} style={{ borderBottom: '1px solid var(--beige)' }}>
                                                <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                                                    {new Date(apt.date).toLocaleDateString('hr-HR')}
                                                </td>
                                                <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                                                    {new Date(apt.date).toLocaleTimeString('hr-HR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{apt.service}</td>
                                                <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                                                    {apt.user?.name || 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Users Tab */}
                        {adminTab === 'users' && (
                            <div style={{ padding: '2rem', background: 'white', borderRadius: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', color: 'var(--graphite)' }}>
                                        Korisnici ({users.length})
                                    </h2>
                                    <input
                                        type="text"
                                        placeholder="Pretraži korisnike..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: '1px solid var(--beige)',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                        <tr style={{ borderBottom: '2px solid var(--beige)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>#</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Ime</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Datum registracije</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredUsers.map((user, index) => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid var(--beige)' }}>
                                                <td style={{ padding: '1rem' }}>{index + 1}</td>
                                                <td style={{ padding: '1rem' }}>{user.name}</td>
                                                <td style={{ padding: '1rem' }}>{user.email}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    {new Date(user.createdAt).toLocaleDateString('hr-HR')}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Stats Tab */}
                        {adminTab === 'stats' && (
                            <div style={{ padding: '2rem' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1.5rem',
                                    marginBottom: '2rem'
                                }}>
                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number">{stats?.totalAppointments || 0}</span>
                                            <span className="points-label">Ukupno termina</span>
                                        </div>
                                    </div>
                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number">{stats?.totalUsers || 0}</span>
                                            <span className="points-label">Ukupno korisnica</span>
                                        </div>
                                    </div>
                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number" style={{ fontSize: '1.8rem' }}>
                                                {stats?.topService || 'N/A'}
                                            </span>
                                            <span className="points-label">Najpopularnija usluga</span>
                                        </div>
                                    </div>
                                    <div className="points-balance-card">
                                        <div className="points-display">
                                            <span className="points-number">{getTodayCount()}</span>
                                            <span className="points-label">Termini danas</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Service breakdown */}
                                <div style={{
                                    background: 'white',
                                    borderRadius: '1rem',
                                    padding: '1.5rem'
                                }}>
                                    <h3 className="section-label" style={{ marginBottom: '1.5rem' }}>
                                        Usluge po popularnosti
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {getServiceBreakdown().map((item, index) => {
                                            const percentage = stats?.totalAppointments
                                                ? Math.round((item.count / stats.totalAppointments) * 100)
                                                : 0;
                                            return (
                                                <div key={item.service}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        <span style={{ fontWeight: '500' }}>
                                                            {index + 1}. {item.service}
                                                        </span>
                                                        <span style={{ color: 'var(--graphite)', opacity: 0.8 }}>
                                                            {item.count} ({percentage}%)
                                                        </span>
                                                    </div>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    // USER DASHBOARD (ostatak koda ostaje isti)
    const upcomingAppointments = appointments
        .filter(a => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const d = new Date(a.date);
            d.setHours(0, 0, 0, 0);

            return d >= now;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    const pastAppointments = appointments
        .filter(a => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const d = new Date(a.date);
            d.setHours(0, 0, 0, 0);

            return d < now;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    return (
        <div className="user-dashboard-container">
            <Navbar className={showBooking ? "navbar-hide" : ""} />

            <main className="user-dashboard-main">
                <div className="dashboard-container">
                    <div className="tab-navigation">
                        <button
                            className={`tab-button ${activeTab === "appointments" ? "active" : ""}`}
                            onClick={() => setActiveTab("appointments")}
                        >
                            Moji Termini
                        </button>
                        <button
                            className={`tab-button ${activeTab === "loyalty" ? "active" : ""}`}
                            onClick={() => setActiveTab("loyalty")}
                        >
                            Loyalty & Kuponi
                        </button>
                        <button
                            className={`tab-button ${activeTab === "invite" ? "active" : ""}`}
                            onClick={() => setActiveTab("invite")}
                        >
                            Pozovi Prijatelje
                        </button>
                    </div>

                    <div className="tab-content-wrapper">
                        {activeTab === "appointments" && (
                            <div className="tab-panel appointments-panel active">
                                <header className="panel-header">
                                    <h2 className="panel-title">Moji Termini</h2>
                                    <p className="panel-subtitle">
                                        Nadolazeće rezervacije i nedavne posjete
                                    </p>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowBooking(true)}
                                    >
                                        + Nova rezervacija
                                    </button>

                                </header>

                                <div className="appointments-content">
                                    <div className="appointments-upcoming">
                                        <h3 className="section-label">Nadolazeći termini</h3>
                                        {upcomingAppointments.length > 0 ? (
                                            <>
                                                {upcomingAppointments.slice(1).map((apt) => (
                                                    <article key={apt.id} className="appointment-featured" style={{ marginTop: "1rem" }}>
                                                        <div className="appointment-featured-image">
                                                            <div className="status-badge confirmed">Potvrđeno</div>
                                                        </div>

                                                        <div className="appointment-featured-content">
                                                            <h4 className="appointment-title">{apt.service}</h4>

                                                            <div className="appointment-meta">
                                                            <span className="appointment-date">
                                                            {formatDate(apt.date).full}
                                                            </span>
                                                            </div>

                                                            <div className="appointment-actions">
                                                                <button
                                                                    className="btn btn-outline"
                                                                    onClick={() => cancelAppointment(apt.id)}
                                                                >
                                                                    Otkaži
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </article>
                                                ))}

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
                                </div>
                            </div>
                        )}

                        {activeTab === "loyalty" && (
                            <div className="tab-panel loyalty-panel active">
                                <header className="panel-header">
                                    <h2 className="panel-title">Loyalty bodovi</h2>
                                    <p className="panel-subtitle">
                                        Vaša elegancija, nagrađena
                                    </p>
                                </header>
                                <div className="points-balance-card">
                                    <div className="points-display">
                                        <span className="points-number">238</span>
                                        <span className="points-label">Dostupnih bodova</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'invite' && (
                            <div className="tab-panel invite-panel active">
                                <div className="invite-hero">
                                    <h2 className="invite-title">Pozovi prijatelje i zaradi</h2>
                                    <div className="invite-code-section">
                                        <div className="code-display">{inviteCode}</div>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => copyToClipboard(inviteCode)}
                                        >
                                            📋 Kopiraj kod
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <BookAppointmentSidebar
                open={showBooking}
                onClose={() => setShowBooking(false)}
                token={localStorage.getItem("token")!}
                appointments={appointments}
                refresh={fetchAppointments}
            />



        </div>
    );
}