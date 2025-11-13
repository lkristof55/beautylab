'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '../../dashboard/dashboard-styles.css'

interface User {
    id: string
    name: string
    email: string
    createdAt: string
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/login')
            return
        }

        fetchUsers()
    }, [router])

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            } else if (res.status === 403) {
                router.push('/dashboard')
            } else if (res.status === 401) {
                router.push('/login')
            }
        } catch (err) {
            console.error('Greška pri dohvaćanju korisnika:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('hr-HR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Učitavanje korisnika...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden'
        }}>
            <header className="panel-header" style={{
                flexShrink: 0,
                padding: '1.5rem 2rem',
                background: 'white',
                borderBottom: '1px solid var(--beige)',
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 className="panel-title" style={{ marginBottom: '0.25rem' }}>👩‍💻 Korisnice</h2>
                        <p className="panel-subtitle" style={{ margin: 0 }}>
                            Ukupno korisnica: <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{users.length}</span>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Pretraži korisnike..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '0.625rem 1rem 0.625rem 2.5rem',
                                    border: '1px solid var(--beige)',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    minWidth: '250px'
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                left: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '1.2rem'
                            }}>
                                🔍
                            </span>
                        </div>
                        <button
                            onClick={() => fetchUsers()}
                            className="btn btn-outline btn-sm"
                        >
                            🔄 Osvježi
                        </button>
                    </div>
                </div>
            </header>

            {/* Glavni sadržaj sa tablicom */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                padding: '0 1rem 1rem 1rem',
                minHeight: 0,
                overflow: 'hidden'
            }}>
                {/* Tablica korisnika */}
                <div style={{
                    flex: 1,
                    background: 'white',
                    borderRadius: '1rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'auto'
                    }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: '600px'
                        }}>
                            <thead style={{
                                position: 'sticky',
                                top: 0,
                                background: 'var(--blush)',
                                zIndex: 10
                            }}>
                            <tr>
                                <th style={{
                                    padding: '1rem',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    borderBottom: '2px solid var(--beige)'
                                }}>#</th>
                                <th style={{
                                    padding: '1rem',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    borderBottom: '2px solid var(--beige)'
                                }}>Ime</th>
                                <th style={{
                                    padding: '1rem',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    borderBottom: '2px solid var(--beige)'
                                }}>Email</th>
                                <th style={{
                                    padding: '1rem',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    borderBottom: '2px solid var(--beige)'
                                }}>Datum registracije</th>
                                <th style={{
                                    padding: '1rem',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    borderBottom: '2px solid var(--beige)'
                                }}>Status</th>
                                <th style={{
                                    padding: '1rem',
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    borderBottom: '2px solid var(--beige)'
                                }}>Akcije</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                                        <p style={{ color: 'var(--graphite)', opacity: 0.6 }}>
                                            {searchTerm
                                                ? 'Nema korisnika koji odgovaraju pretraživanju'
                                                : 'Nema registriranih korisnika'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        style={{
                                            borderBottom: '1px solid var(--beige)',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--porcelain)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem' }}>{index + 1}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{user.name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--graphite)', opacity: 0.8 }}>
                                            {user.email}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                                <span className="status-badge confirmed">
                                                    Aktivan
                                                </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button
                                                className="btn-link"
                                                title="Pregledaj detalje"
                                                style={{ marginRight: '0.5rem' }}
                                            >
                                                👁️
                                            </button>
                                            <button
                                                className="btn-link"
                                                title="Pošalji poruku"
                                            >
                                                ✉️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    flexShrink: 0
                }}>
                    <div className="points-balance-card" style={{
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}>
                        <div className="subsection-title" style={{ fontSize: '0.875rem' }}>
                            Novi ovaj mjesec
                        </div>
                        <div className="points-number" style={{ fontSize: '1.75rem' }}>
                            {users.filter(u => {
                                const userDate = new Date(u.createdAt)
                                const now = new Date()
                                return userDate.getMonth() === now.getMonth() &&
                                    userDate.getFullYear() === now.getFullYear()
                            }).length}
                        </div>
                    </div>

                    <div className="points-balance-card" style={{
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}>
                        <div className="subsection-title" style={{ fontSize: '0.875rem' }}>
                            Ovaj tjedan
                        </div>
                        <div className="points-number" style={{ fontSize: '1.75rem' }}>
                            {users.filter(u => {
                                const userDate = new Date(u.createdAt)
                                const now = new Date()
                                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                                return userDate > weekAgo
                            }).length}
                        </div>
                    </div>

                    <div className="points-balance-card" style={{
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}>
                        <div className="subsection-title" style={{ fontSize: '0.875rem' }}>
                            Prosječno mjesečno
                        </div>
                        <div className="points-number" style={{ fontSize: '1.75rem' }}>
                            {users.length > 0 ? Math.round(users.length / 12) : 0}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}