'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import '../../dashboard/dashboard-styles.css'



// Import admin komponenti
import AdminUsers from "../users/page.tsx";
import AdminStats from '../stats/page.tsx'




export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('calendar')
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        const overlay = document.querySelector(".booking-sidebar-overlay");
        if (overlay) overlay.remove();
    }, []);

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
    }

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
                                onClick={() => setActiveTab('calendar')}
                                className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    transition: 'all 0.3s',
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: activeTab === 'calendar' ? 'var(--rose)' : 'transparent',
                                    color: activeTab === 'calendar' ? 'white' : 'var(--graphite)',
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
                                onClick={() => setActiveTab('users')}
                                className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    transition: 'all 0.3s',
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: activeTab === 'users' ? 'var(--rose)' : 'transparent',
                                    color: activeTab === 'users' ? 'white' : 'var(--graphite)',
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
                                onClick={() => setActiveTab('stats')}
                                className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    transition: 'all 0.3s',
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: activeTab === 'stats' ? 'var(--rose)' : 'transparent',
                                    color: activeTab === 'stats' ? 'white' : 'var(--graphite)',
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
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(224, 126, 158, 0.1)';
                                        e.currentTarget.style.color = 'var(--rose)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--graphite)';
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>🚪</span>
                                    <span style={{ fontWeight: '500' }}>Odjava</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* User info at bottom */}
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

            {/* Main Content - SA MARGINOM ZA SIDEBAR */}
            <main style={{
                marginLeft: '260px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh'
            }}>
                {/* Top bar */}
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
                                {activeTab === 'calendar' && '📅 Kalendar termina'}
                                {activeTab === 'users' && '👩‍💻 Upravljanje korisnicima'}
                                {activeTab === 'stats' && '📊 Statistika i analitika'}
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
                    {activeTab === 'calendar' && <AdminCalendar />}
                    {activeTab === 'users' && <AdminUsers />}
                    {activeTab === 'stats' && <AdminStats />}
                </div>
            </main>
        </div>
    )
}

function AdminCalendar() {
    const [appointments, setAppointments] = useState([]);
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualDate, setManualDate] = useState(null);
    const [manualService, setManualService] = useState("");
    const [manualTime, setManualTime] = useState("");

    const fetchAdminAppointments = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/appointments", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setAppointments(data);
        }
    };

    useEffect(() => {
        fetchAdminAppointments();
    }, []);

    const handleDateClick = (info) => {
        setManualDate(new Date(info.date));
        setShowManualModal(true);
    };

    const saveManualAppointment = async () => {
        if (!manualDate || !manualTime || !manualService) return;

        const [h, m] = manualTime.split(":");
        const start = new Date(manualDate);
        start.setHours(Number(h), Number(m), 0, 0);

        const token = localStorage.getItem("token");

        const res = await fetch("/api/appointments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                service: manualService,
                date: start.toISOString(),
                duration: 60,
                adminCreated: true
            })
        });

        if (res.ok) {
            setShowManualModal(false);
            fetchAdminAppointments();
        }
    };

    const calendarEvents = appointments.map((apt) => {
        const start = new Date(apt.date);
        const end = new Date(start.getTime() + (apt.duration || 60) * 60000);

        return {
            id: apt.id,
            title: `${apt.service} – ${apt.user?.name || ""}`,
            start,
            end,
            backgroundColor: "#e07e9e",
            textColor: "#fff"
        };
    });


    return (
        <div style={{ background: "white", padding: "2rem", borderRadius: "1rem", height: "100%" }}>
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                dateClick={handleDateClick}
                events={calendarEvents}
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,dayGridWeek,dayGridDay",
                }}
                eventClick={(info) => {
                    // blokiraj event klik
                    info.jsEvent.preventDefault();
                    info.jsEvent.stopPropagation();
                }}
            />



            {showManualModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Dodaj termin</h2>

                        <label>Usluga</label>
                        <select onChange={(e) => setManualService(e.target.value)}>
                            <option value="">Odaberi...</option>
                            <option value="Lash Lift">Lash Lift</option>
                            <option value="Brow Lift">Brow Lift</option>
                            <option value="Nokti">Nokti</option>
                        </select>

                        <label>Vrijeme</label>
                        <input type="time" onChange={(e) => setManualTime(e.target.value)} />

                        <button className="btn btn-primary" onClick={saveManualAppointment}>
                            Spremi
                        </button>
                        <button className="btn btn-outline" onClick={() => setShowManualModal(false)}>
                            Zatvori
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
