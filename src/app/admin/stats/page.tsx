'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '../../dashboard/dashboard-styles.css'

interface Stats {
    totalAppointments: number
    totalUsers: number
    topService: string
}

interface ServiceCount {
    service: string
    count: number
}

export default function AdminStatsPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/login')
            return
        }

        fetchStats()
        fetchAppointments()
    }, [router])

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setStats(data)
            } else if (res.status === 403) {
                router.push('/dashboard')
            } else if (res.status === 401) {
                router.push('/login')
            }
        } catch (err) {
            console.error('Greška pri dohvaćanju statistike:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/appointments', {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data)) {
                    setAppointments(data)
                }
            }
        } catch (err) {
            console.error('Greška pri dohvaćanju termina:', err)
        }
    }

    const getServiceBreakdown = (): ServiceCount[] => {
        const serviceMap = new Map<string, number>()
        appointments.forEach(apt => {
            const count = serviceMap.get(apt.service) || 0
            serviceMap.set(apt.service, count + 1)
        })
        return Array.from(serviceMap, ([service, count]) => ({ service, count }))
            .sort((a, b) => b.count - a.count)
    }

    const getMonthlyBreakdown = () => {
        const monthMap = new Map<string, number>()
        appointments.forEach(apt => {
            const date = new Date(apt.date)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const count = monthMap.get(key) || 0
            monthMap.set(key, count + 1)
        })
        return Array.from(monthMap, ([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6)
    }

    const servicePrices: Record<string, number> = {
        'Manikura': 35,
        'Pedikura': 45,
        'Depilacija': 30,
        'Masaža': 60,
    }

    const calculateRevenue = () => {
        return appointments.reduce((total, apt) => {
            const price = servicePrices[apt.service] || 40
            return total + price
        }, 0)
    }

    const getUpcomingCount = () => {
        const now = new Date()
        return appointments.filter(apt => new Date(apt.date) > now).length
    }

    const getTodayCount = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        return appointments.filter(apt => {
            const aptDate = new Date(apt.date)
            return aptDate >= today && aptDate < tomorrow
        }).length
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Učitavanje statistike...</p>
                </div>
            </div>
        )
    }

    const serviceBreakdown = getServiceBreakdown()
    const monthlyBreakdown = getMonthlyBreakdown()
    const totalRevenue = calculateRevenue()

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
                        <h2 className="panel-title" style={{ marginBottom: '0.25rem' }}>📊 Statistika</h2>
                        <p className="panel-subtitle" style={{ margin: 0 }}>
                            Pregled poslovanja i analitika
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            fetchStats()
                            fetchAppointments()
                        }}
                        className="btn btn-outline btn-sm"
                    >
                        🔄 Osvježi
                    </button>
                </div>
            </header>

            {/* Glavni sadržaj sa scroll */}
            <div style={{
                flex: 1,
                padding: '0 1rem 1rem 1rem',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}>
                {/* Glavne statistike kartice */}
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
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'var(--porcelain)',
                            borderRadius: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.875rem', color: 'green' }}>+12% ↑ ovaj mjesec</span>
                        </div>
                    </div>

                    <div className="points-balance-card">
                        <div className="points-display">
                            <span className="points-number">{stats?.totalUsers || 0}</span>
                            <span className="points-label">Ukupno korisnica</span>
                        </div>
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'var(--porcelain)',
                            borderRadius: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.875rem', color: 'green' }}>+8% ↑ ovaj mjesec</span>
                        </div>
                    </div>

                    <div className="points-balance-card">
                        <div className="points-display">
                            <span className="points-number" style={{ fontSize: '2.5rem' }}>
                                €{totalRevenue.toLocaleString()}
                            </span>
                            <span className="points-label">Ukupni prihod</span>
                        </div>
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'var(--porcelain)',
                            borderRadius: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.875rem', color: 'green' }}>+15% ↑ ovaj mjesec</span>
                        </div>
                    </div>

                    <div className="points-balance-card">
                        <div className="points-display">
                            <span className="points-number" style={{ fontSize: '1.8rem' }}>
                                {stats?.topService || 'N/A'}
                            </span>
                            <span className="points-label">Najpopularnija usluga</span>
                        </div>
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'var(--porcelain)',
                            borderRadius: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.875rem' }}>⭐ Top izbor</span>
                        </div>
                    </div>
                </div>

                {/* Detaljne analize u 2 kolone */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {/* Analiza po uslugama */}
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}>
                        <h3 className="section-label" style={{ marginBottom: '1.5rem' }}>
                            📊 Usluge po popularnosti
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {serviceBreakdown.map((item, index) => {
                                const percentage = stats?.totalAppointments
                                    ? Math.round((item.count / stats.totalAppointments) * 100)
                                    : 0
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
                                )
                            })}
                        </div>
                    </div>

                    {/* Trend po mjesecima */}
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}>
                        <h3 className="section-label" style={{ marginBottom: '1.5rem' }}>
                            📈 Trend zadnjih 6 mjeseci
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {monthlyBreakdown.map(item => {
                                const [year, month] = item.month.split('-')
                                const monthName = new Date(parseInt(year), parseInt(month) - 1)
                                    .toLocaleDateString('hr-HR', { month: 'long', year: 'numeric' })
                                const maxCount = Math.max(...monthlyBreakdown.map(m => m.count))
                                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0

                                return (
                                    <div key={item.month}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                                                {monthName}
                                            </span>
                                            <span style={{ color: 'var(--graphite)', opacity: 0.8 }}>
                                                {item.count} termina
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${percentage}%`,
                                                    background: 'linear-gradient(90deg, var(--gold) 0%, var(--beige) 100%)'
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}>
                        <h3 className="section-label" style={{ marginBottom: '1.5rem' }}>
                            ⚡ Trenutni status
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="appointment-card" style={{ padding: '1rem' }}>
                                <div className="appointment-info">
                                    <h4 className="appointment-name">Danas</h4>
                                    <p className="appointment-time">termina zakazano</p>
                                </div>
                                <div className="appointment-status">
                                    <span className="points-number" style={{ fontSize: '1.5rem', color: 'var(--gold)' }}>
                                        {getTodayCount()}
                                    </span>
                                </div>
                            </div>

                            <div className="appointment-card" style={{ padding: '1rem' }}>
                                <div className="appointment-info">
                                    <h4 className="appointment-name">Nadolazeći</h4>
                                    <p className="appointment-time">aktivnih rezervacija</p>
                                </div>
                                <div className="appointment-status">
                                    <span className="points-number" style={{ fontSize: '1.5rem', color: 'var(--rose)' }}>
                                        {getUpcomingCount()}
                                    </span>
                                </div>
                            </div>

                            <div className="appointment-card" style={{ padding: '1rem' }}>
                                <div className="appointment-info">
                                    <h4 className="appointment-name">Prosječno</h4>
                                    <p className="appointment-time">po terminu</p>
                                </div>
                                <div className="appointment-status">
                                    <span className="points-number" style={{ fontSize: '1.5rem', color: 'var(--beige)' }}>
                                        €{appointments.length > 0 ? Math.round(totalRevenue / appointments.length) : 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}