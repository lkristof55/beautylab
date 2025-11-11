'use client'

import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

export default function DashboardPage() {
    const [appointments, setAppointments] = useState<any[]>([])
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [dailyAppointments, setDailyAppointments] = useState<any[]>([])

    // 🔹 Dohvati termine s backenda
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return

        fetch('/api/admin/appointments', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setAppointments(data)
            })
            .catch((err) => console.error('Greška pri dohvaćanju termina:', err))
    }, [])

    // 🔹 Event handler za klik na dan
    const handleDateClick = (info: any) => {
        const clickedDate = info.dateStr
        setSelectedDate(clickedDate)

        // Filtriraj termine po datumu
        const filtered = appointments.filter((a) => {
            const date = new Date(a.date)
            return date.toISOString().split('T')[0] === clickedDate
        })

        setDailyAppointments(filtered)
    }

    return (
        <div>
            <h1 className="text-3xl font-heading mb-6">📅 Kalendar termina</h1>

            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="hr"
                height="80vh"
                events={appointments.map((a) => ({
                    title: `${a.service} – ${a.user?.name || ''}`,
                    date: new Date(a.date).toISOString().split('T')[0],
                }))}
                dateClick={handleDateClick}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth',
                }}
            />

            {/* Modal s terminima */}
            {selectedDate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-[400px]">
                        <h2 className="text-2xl font-heading mb-4">
                            Termini za {new Date(selectedDate).toLocaleDateString('hr-HR')}
                        </h2>

                        {dailyAppointments.length === 0 ? (
                            <p className="text-gray-500">Nema termina za ovaj dan.</p>
                        ) : (
                            <ul className="space-y-3">
                                {dailyAppointments.map((a) => (
                                    <li
                                        key={a.id}
                                        className="border border-beige p-3 rounded-lg shadow-sm bg-pink/10"
                                    >
                                        <p className="font-bold">{a.service}</p>
                                        <p>{a.user?.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(a.date).toLocaleTimeString('hr-HR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <button
                            className="mt-5 bg-pink text-white px-4 py-2 rounded-xl hover:opacity-80"
                            onClick={() => setSelectedDate(null)}
                        >
                            Zatvori
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
