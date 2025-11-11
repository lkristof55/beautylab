'use client'
import { useEffect, useState } from 'react'

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        const token = localStorage.getItem('token')
        fetch('/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setStats(data))
    }, [])

    if (!stats) return <p>Učitavanje...</p>

    return (
        <div>
            <h1 className="text-3xl font-heading mb-6">📊 Statistika</h1>
            <div className="space-y-3">
                <p>Ukupno termina: {stats.totalAppointments}</p>
                <p>Ukupno korisnica: {stats.totalUsers}</p>
                <p>Najpopularnija usluga: {stats.topService}</p>
            </div>
        </div>
    )
}
