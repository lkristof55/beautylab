"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import '../dashboard/dashboard-styles.css';

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

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
                                href="/admin/dashboard"
                                className={`tab-button ${isActive('/admin/dashboard') ? 'active' : ''}`}
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
                                    background: isActive('/admin/dashboard') ? 'var(--rose)' : 'transparent',
                                    color: isActive('/admin/dashboard') ? 'white' : 'var(--graphite)',
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
                            }}>
                                {pathname === '/admin/dashboard' && '📅 Kalendar termina'}
                                {pathname === '/admin/users' && '👩‍💻 Upravljanje korisnicima'}
                                {pathname === '/admin/stats' && '📊 Statistika i analitika'}
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
        </div>
    );
}