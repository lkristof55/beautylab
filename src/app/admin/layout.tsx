"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SettingsModal from "@/components/SettingsModal";
import '../dashboard/dashboard-styles.css';

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [notificationInterval, setNotificationInterval] = useState(30); // Default 30 sekundi

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Admin email provjera
        const adminEmail = 'irena@beautylab.hr'; // Promijeni prema potrebi
        if (parsedUser.email !== adminEmail) {
            router.push('/dashboard');
        }
    }, [router]);

    // Fetch notifications
    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Dohvati postavke za interval
            const fetchSettings = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    const res = await fetch('/api/admin/settings', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const settings = await res.json();
                        setNotificationInterval(settings.notificationRefreshInterval || 30);
                    }
                } catch (err) {
                    console.error('Error fetching settings:', err);
                }
            };
            fetchSettings();
        }
    }, [user]);

    // Osvježi notifikacije prema intervalu iz postavki
    useEffect(() => {
        if (user && notificationInterval > 0) {
            const interval = setInterval(fetchNotifications, notificationInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [user, notificationInterval]);

    // Zatvori dropdown kada se klikne izvan
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showNotifications && !target.closest('[data-notifications-container]')) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showNotifications]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const res = await fetch('/api/admin/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const handleNotificationClick = (notif: any) => {
        setShowNotifications(false);
        if (notif.type === 'today_appointment' || notif.type === 'new_appointment' || notif.type === 'incomplete') {
            router.push('/dashboard');
        } else if (notif.type === 'new_user') {
            router.push('/admin/users');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const isActive = (path: string) => {
        return pathname === path;
    };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: 'var(--porcelain)'
        }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                background: 'white',
                borderRight: '1px solid var(--beige)',
                boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 100
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
                            <Link
                                href="/dashboard"
                                className={`tab-button ${isActive('/dashboard') ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    transition: 'all 0.3s',
                                    textDecoration: 'none',
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: isActive('/dashboard') ? 'var(--rose)' : 'transparent',
                                    color: isActive('/dashboard') ? 'white' : 'var(--graphite)',
                                    border: 'none',
                                    fontSize: '1rem'
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>📅</span>
                                <span style={{ fontWeight: '500' }}>Termini</span>
                            </Link>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <Link
                                href="/admin/users"
                                className={`tab-button ${isActive('/admin/users') ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    transition: 'all 0.3s',
                                    textDecoration: 'none',
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: isActive('/admin/users') ? 'var(--rose)' : 'transparent',
                                    color: isActive('/admin/users') ? 'white' : 'var(--graphite)',
                                    border: 'none',
                                    fontSize: '1rem'
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>👩‍💻</span>
                                <span style={{ fontWeight: '500' }}>Korisnice</span>
                            </Link>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <Link
                                href="/admin/stats"
                                className={`tab-button ${isActive('/admin/stats') ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    transition: 'all 0.3s',
                                    textDecoration: 'none',
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: isActive('/admin/stats') ? 'var(--rose)' : 'transparent',
                                    color: isActive('/admin/stats') ? 'white' : 'var(--graphite)',
                                    border: 'none',
                                    fontSize: '1rem'
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>📊</span>
                                <span style={{ fontWeight: '500' }}>Statistika</span>
                            </Link>
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <Link
                                href="/admin/loyalty"
                                className={`tab-button ${isActive('/admin/loyalty') ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    transition: 'all 0.3s',
                                    textDecoration: 'none',
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: isActive('/admin/loyalty') ? 'var(--rose)' : 'transparent',
                                    color: isActive('/admin/loyalty') ? 'white' : 'var(--graphite)',
                                    border: 'none',
                                    fontSize: '1rem'
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>⭐</span>
                                <span style={{ fontWeight: '500' }}>Loyalty</span>
                            </Link>
                        </li>
                    </ul>

                    <div style={{
                        borderTop: '1px solid var(--beige)',
                        marginTop: '2rem',
                        paddingTop: '2rem'
                    }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <Link
                                    href="/dashboard"
                                    className="btn-link"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.875rem 1rem',
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.3s',
                                        textDecoration: 'none',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        color: 'var(--graphite)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--porcelain)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>🏠</span>
                                    <span style={{ fontWeight: '500' }}>Korisnički panel</span>
                                </Link>
                            </li>
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
                                        textDecoration: 'none',
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
                        background: 'var(--porcelain)'
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
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: 'var(--graphite)',
                                    margin: 0
                                }}>
                                    {user.name}
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

            {/* Glavni sadržaj sa offsetom za sidebar */}
            <main style={{
                marginLeft: '260px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                position: 'relative'
            }}>
                {/* Top bar */}
                <div style={{
                    background: 'white',
                    borderBottom: '1px solid var(--beige)',
                    padding: '1.5rem 2rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50
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
                            }}                            >
                                {pathname === '/dashboard' && '📅 Kalendar termina'}
                                {pathname === '/admin/users' && '👩‍💻 Upravljanje korisnicima'}
                                {pathname === '/admin/stats' && '📊 Statistika i analitika'}
                                {pathname === '/admin/loyalty' && '⭐ Loyalty program'}
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
                            <div style={{ position: 'relative' }} data-notifications-container>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="btn btn-outline btn-sm"
                                    style={{ position: 'relative' }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>🔔</span>
                                    {unreadCount > 0 && (
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
                                            justifyContent: 'center',
                                            fontWeight: 'bold'
                                        }}>
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {showNotifications && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 0.5rem)',
                                    right: 0,
                                    background: 'white',
                                    borderRadius: '0.75rem',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                    width: '360px',
                                    maxHeight: '480px',
                                    overflow: 'auto',
                                    zIndex: 1000,
                                    border: '1px solid var(--beige)'
                                }}>
                                    <div style={{ 
                                        padding: '1.25rem', 
                                        borderBottom: '1px solid var(--beige)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--graphite)' }}>
                                            Notifikacije
                                        </h3>
                                        {unreadCount > 0 && (
                                            <span style={{
                                                background: 'var(--rose)',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '1rem',
                                                fontWeight: 600
                                            }}>
                                                {unreadCount} nov{unreadCount === 1 ? 'a' : 'ih'}
                                            </span>
                                        )}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--graphite)', opacity: 0.6 }}>
                                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔕</div>
                                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Nema novih notifikacija</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {notifications.map((notif, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    style={{
                                                        padding: '1.25rem',
                                                        borderBottom: idx < notifications.length - 1 ? '1px solid var(--beige)' : 'none',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s',
                                                        background: 'white'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--porcelain)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                                                        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                                                            {notif.icon}
                                                        </span>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ 
                                                                margin: 0, 
                                                                fontSize: '0.9rem', 
                                                                fontWeight: 500,
                                                                color: 'var(--graphite)',
                                                                lineHeight: '1.4'
                                                            }}>
                                                                {notif.message}
                                                            </p>
                                                            <p style={{ 
                                                                margin: '0.25rem 0 0 0', 
                                                                fontSize: '0.75rem', 
                                                                color: 'var(--graphite)',
                                                                opacity: 0.6
                                                            }}>
                                                                {notif.type === 'new_appointment' && 'Klikni za pregled termina'}
                                                                {notif.type === 'today_appointment' && 'Klikni za pregled današnjih termina'}
                                                                {notif.type === 'new_user' && 'Klikni za pregled korisnika'}
                                                                {notif.type === 'incomplete' && 'Klikni za dovršavanje termina'}
                                                            </p>
                                                        </div>
                                                        <span style={{
                                                            background: notif.priority === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                                                                      notif.priority === 'warning' ? 'rgba(251, 191, 36, 0.1)' : 
                                                                      'rgba(59, 130, 246, 0.1)',
                                                            color: notif.priority === 'error' ? '#ef4444' : 
                                                                   notif.priority === 'warning' ? '#fbbf24' : 
                                                                   '#3b82f6',
                                                            fontSize: '0.75rem',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '0.5rem',
                                                            fontWeight: 600,
                                                            flexShrink: 0
                                                        }}>
                                                            {notif.count}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                )}
                            </div>
                            
                            {/* Settings Button */}
                            <button 
                                className="btn btn-outline btn-sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowSettings(true);
                                }}
                                style={{ 
                                    position: 'relative', 
                                    zIndex: 10,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '40px',
                                    height: '40px'
                                }}
                                title="Postavke"
                            >
                                <span style={{ fontSize: '1.25rem' }}>⚙️</span>
                            </button>
                        </div>
                </div>

                {/* Page content - BEZ PADDINGA */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {children}
                </div>
            </main>
            
            {/* Settings Modal */}
            <SettingsModal 
                open={showSettings} 
                onClose={() => setShowSettings(false)} 
            />
        </div>
    );
}