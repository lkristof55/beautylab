"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Appointment = {
    id: string;
    service: string;
    date: string; // ISO
    duration?: number; // trajanje u minutama
    status?: "BOOKED" | "CANCELLED";
};

// Konfiguracija usluga sa trajanjem
const SERVICES_CONFIG = {
    "Manikura": { duration: 45, price: 35, description: "Klasična manikura" },
    "Gel nokti": { duration: 90, price: 55, description: "Gel lak koji traje 3-4 tjedna" },
    "Pedikura": { duration: 60, price: 45, description: "Njega stopala" },
    "Depilacija - noge": { duration: 45, price: 40, description: "Depilacija cijelih nogu" },
    "Depilacija - bikini": { duration: 30, price: 30, description: "Bikini zona" },
    "Masaža": { duration: 60, price: 60, description: "Relax masaža" },
    "Trepavice": { duration: 90, price: 80, description: "Ugradnja trepavica" },
    "Obrve": { duration: 30, price: 25, description: "Oblikovanje obrva" }
};

const SERVICES = Object.keys(SERVICES_CONFIG);

export default function AppointmentsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string } | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedService, setSelectedService] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("token") : null), []);

    useEffect(() => {
        const boot = async () => {
            if (!token) return router.push("/login");
            try {
                const [pRes, aRes] = await Promise.all([
                    fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
                    fetch("/api/appointments", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
                ]);
                if (pRes.status === 401 || aRes.status === 401) {
                    localStorage.removeItem("token");
                    return router.push("/login");
                }
                const pData = await pRes.json();
                const aData = await aRes.json();
                setUser(pData?.user ?? null);
                setAppointments(Array.isArray(aData.appointments) ? aData.appointments : []);
            } catch (e) {
                console.error(e);
                setMsg({ type: "err", text: "Greška pri učitavanju podataka." });
            } finally {
                setLoading(false);
            }
        };
        boot();
    }, [router, token]);

    // Generiraj dostupna vremena
    const generateTimeSlots = () => {
        const slots = [];
        const startHour = 9; // Početak radnog vremena
        const endHour = 19; // Kraj radnog vremena

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeString);
            }
        }
        return slots;
    };

    // Provjeri je li vrijeme slobodno
    const isTimeSlotAvailable = (date: Date, time: string, serviceDuration: number) => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotStart = new Date(date);
        slotStart.setHours(hours, minutes, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

        // Provjeri koliziju sa postojećim terminima
        return !appointments.some(apt => {
            if (apt.status === "CANCELLED") return false;

            const aptStart = new Date(apt.date);
            const aptDuration = apt.duration || 60;
            const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);

            // Provjeri preklapanje
            return (slotStart < aptEnd && slotEnd > aptStart);
        });
    };

    const within24h = (iso: string) => {
        const now = new Date().getTime();
        const when = new Date(iso).getTime();
        return when - now < 24 * 60 * 60 * 1000;
    };

    const createAppt = async () => {
        if (!token) return router.push("/login");
        if (!selectedService || !selectedDate || !selectedTime) {
            setMsg({ type: "err", text: "Molim odaberi sve podatke." });
            return;
        }

        setBusy(true);
        setMsg(null);

        try {
            // Kombiniraj datum i vrijeme
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const appointmentDate = new Date(selectedDate);
            appointmentDate.setHours(hours, minutes, 0, 0);

            const serviceConfig = SERVICES_CONFIG[selectedService as keyof typeof SERVICES_CONFIG];

            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    service: selectedService,
                    date: appointmentDate.toISOString(),
                    duration: serviceConfig.duration
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Neuspjela rezervacija");

            setAppointments((prev) => [...prev, { ...data.appointment, duration: serviceConfig.duration }]);
            setShowModal(false);
            setSelectedService("");
            setSelectedDate(null);
            setSelectedTime("");
            setMsg({ type: "ok", text: `Termin rezerviran! ✅ Trajanje: ${serviceConfig.duration} min` });
        } catch (e: any) {
            setMsg({ type: "err", text: e?.message ?? "Greška pri rezervaciji." });
        } finally {
            setBusy(false);
        }
    };

    const cancelAppt = async (id: string) => {
        if (!token) return router.push("/login");
        try {
            const res = await fetch(`/api/appointments`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ appointmentId: id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Greška pri otkazivanju");
            setAppointments((prev) => prev.filter((a) => a.id !== id));
            setMsg({ type: "ok", text: "Termin otkazan." });
        } catch (e: any) {
            setMsg({ type: "err", text: e?.message ?? "Greška pri otkazivanju." });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-porcelain to-blush">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent mb-4"></div>
                    <p className="text-gray-600">Učitavanje…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-porcelain via-white to-blush py-10 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Header Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-beige shadow-lg p-8 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-heading font-bold text-graphite mb-2">
                                📅 Moji termini
                            </h1>
                            <p className="text-gray-600">
                                Upravljaj rezervacijama — brzo i jednostavno.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-4 py-2 border border-beige rounded-lg hover:bg-porcelain transition text-sm"
                        >
                            ← Dashboard
                        </button>
                    </div>

                    {msg && (
                        <div
                            className={`rounded-xl border px-4 py-3 text-sm mb-4 ${
                                msg.type === "ok"
                                    ? "border-green-300 bg-green-50 text-green-800"
                                    : "border-red-300 bg-red-50 text-red-800"
                            }`}
                        >
                            {msg.text}
                        </div>
                    )}

                    {/* Gumb za novi termin */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full md:w-auto px-6 py-3 bg-gold text-white rounded-lg font-semibold hover:brightness-95 transition"
                    >
                        + Rezerviraj novi termin
                    </button>
                </div>

                {/* Lista termina */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-beige shadow-lg p-8">
                    <h2 className="mb-4 text-2xl font-heading font-semibold text-graphite">
                        Tvoji termini
                    </h2>

                    {appointments.length === 0 ? (
                        <div className="rounded-lg border border-beige bg-porcelain/40 px-6 py-12 text-center">
                            <p className="text-gray-600 mb-4">
                                Nemaš još rezerviranih termina.
                            </p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="text-gold hover:underline"
                            >
                                Klikni ovdje za prvu rezervaciju!
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] border-collapse">
                                <thead>
                                <tr className="bg-gradient-to-r from-blush to-porcelain text-left">
                                    <th className="px-4 py-3 font-semibold text-graphite rounded-tl-lg">
                                        Usluga
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-graphite">
                                        Datum i vrijeme
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-graphite">
                                        Trajanje
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-graphite">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-graphite text-right rounded-tr-lg">
                                        Akcija
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {appointments
                                    .slice()
                                    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
                                    .map((a, i) => {
                                        const zebra = i % 2 === 0 ? "bg-white" : "bg-porcelain/30";
                                        const lock = within24h(a.date);
                                        const serviceConfig = SERVICES_CONFIG[a.service as keyof typeof SERVICES_CONFIG];
                                        return (
                                            <tr key={a.id} className={`${zebra} border-b border-beige last:border-0`}>
                                                <td className="px-4 py-4 font-medium">{a.service}</td>
                                                <td className="px-4 py-4">
                                                    {new Date(a.date).toLocaleString("hr-HR", {
                                                        dateStyle: "short",
                                                        timeStyle: "short",
                                                    })}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {serviceConfig?.duration || 60} min
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                                            a.status === "CANCELLED"
                                                                ? "bg-gray-100 text-gray-700 border border-gray-300"
                                                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        }`}
                                                    >
                                                        {a.status === "CANCELLED" ? "OTKAZANO" : "POTVRĐENO"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {lock ? (
                                                        <span className="text-xs italic text-gray-500">
                                                            Nije moguće otkazati (&lt; 24h)
                                                        </span>
                                                    ) : a.status !== "CANCELLED" ? (
                                                        <button
                                                            onClick={() => cancelAppt(a.id)}
                                                            className="rounded-lg border border-red-300 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                                                        >
                                                            Otkaži
                                                        </button>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal za rezervaciju */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-beige">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-heading font-bold text-graphite">
                                    Novi termin
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Odabir usluge */}
                            <div>
                                <label className="block text-sm font-medium text-graphite mb-2">
                                    Odaberi uslugu
                                </label>
                                <select
                                    className="w-full h-12 rounded-lg border border-beige bg-white px-4 outline-none focus:ring-2 focus:ring-gold/40"
                                    value={selectedService}
                                    onChange={(e) => setSelectedService(e.target.value)}
                                >
                                    <option value="">-- Odaberi --</option>
                                    {SERVICES.map((service) => {
                                        const config = SERVICES_CONFIG[service as keyof typeof SERVICES_CONFIG];
                                        return (
                                            <option key={service} value={service}>
                                                {service} ({config.duration} min) - €{config.price}
                                            </option>
                                        );
                                    })}
                                </select>
                                {selectedService && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {SERVICES_CONFIG[selectedService as keyof typeof SERVICES_CONFIG].description}
                                    </p>
                                )}
                            </div>

                            {/* Odabir datuma */}
                            {selectedService && (
                                <div>
                                    <label className="block text-sm font-medium text-graphite mb-2">
                                        Odaberi datum
                                    </label>
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        minDate={new Date()}
                                        maxDate={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)} // 60 dana unaprijed
                                        dateFormat="dd.MM.yyyy."
                                        placeholderText="Klikni za odabir datuma"
                                        className="w-full h-12 rounded-lg border border-beige px-4 outline-none focus:ring-2 focus:ring-gold/40"
                                        inline
                                    />
                                </div>
                            )}

                            {/* Odabir vremena */}
                            {selectedDate && selectedService && (
                                <div>
                                    <label className="block text-sm font-medium text-graphite mb-2">
                                        Odaberi vrijeme
                                    </label>
                                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-beige rounded-lg">
                                        {generateTimeSlots().map(time => {
                                            const duration = SERVICES_CONFIG[selectedService as keyof typeof SERVICES_CONFIG].duration;
                                            const isAvailable = isTimeSlotAvailable(selectedDate, time, duration);

                                            return (
                                                <button
                                                    key={time}
                                                    onClick={() => isAvailable && setSelectedTime(time)}
                                                    disabled={!isAvailable}
                                                    className={`
                                                        p-2 text-sm rounded-lg transition
                                                        ${selectedTime === time
                                                        ? 'bg-gold text-white'
                                                        : isAvailable
                                                            ? 'bg-white border border-beige hover:bg-porcelain'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                                                    }
                                                    `}
                                                >
                                                    {time}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Pregled rezervacije */}
                            {selectedService && selectedDate && selectedTime && (
                                <div className="bg-porcelain/30 rounded-lg p-4">
                                    <h3 className="font-semibold text-graphite mb-2">Pregled rezervacije:</h3>
                                    <p className="text-sm">
                                        <strong>Usluga:</strong> {selectedService}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Datum:</strong> {selectedDate.toLocaleDateString('hr-HR')}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Vrijeme:</strong> {selectedTime}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Trajanje:</strong> {SERVICES_CONFIG[selectedService as keyof typeof SERVICES_CONFIG].duration} min
                                    </p>
                                    <p className="text-sm">
                                        <strong>Cijena:</strong> €{SERVICES_CONFIG[selectedService as keyof typeof SERVICES_CONFIG].price}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-beige flex gap-3 justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-beige rounded-lg hover:bg-porcelain transition"
                            >
                                Odustani
                            </button>
                            <button
                                onClick={createAppt}
                                disabled={busy || !selectedService || !selectedDate || !selectedTime}
                                className="px-4 py-2 bg-gold text-white rounded-lg font-semibold hover:brightness-95 transition disabled:opacity-60"
                            >
                                {busy ? "Rezerviram..." : "Potvrdi rezervaciju"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}