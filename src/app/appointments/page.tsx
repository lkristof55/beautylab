"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Appointment = {
    id: string;
    service: string;
    date: string; // ISO
    status?: "BOOKED" | "CANCELLED";
};

const SERVICES = ["Manikura", "Pedikura", "Depilacija", "Masaža"];

export default function AppointmentsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string } | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const [service, setService] = useState("");
    const [date, setDate] = useState<Date | null>(null);
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

    const within24h = (iso: string) => {
        const now = new Date().getTime();
        const when = new Date(iso).getTime();
        return when - now < 24 * 60 * 60 * 1000;
    };

    const createAppt = async () => {
        if (!token) return router.push("/login");
        if (!service || !date) return setMsg({ type: "err", text: "Odaberi uslugu i datum." });
        setBusy(true);
        setMsg(null);
        try {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ service, date: date.toISOString() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Neuspjela rezervacija");
            setAppointments((prev) => [...prev, data.appointment]);
            setService("");
            setDate(null);
            setMsg({ type: "ok", text: "Termin je rezerviran ✅" });
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

                    {/* Novi termin */}
                    <section className="mb-8">
                        <h2 className="mb-4 text-xl font-heading font-semibold text-gold">
                            + Novi termin
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-[1fr_260px_auto]">
                            <select
                                className="h-12 w-full rounded-lg border border-beige bg-white px-4 outline-none focus:ring-2 focus:ring-gold/40 transition"
                                value={service}
                                onChange={(e) => setService(e.target.value)}
                            >
                                <option value="">Odaberi uslugu…</option>
                                {SERVICES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>

                            <div>
                                <DatePicker
                                    selected={date}
                                    onChange={(d) => setDate(d)}
                                    showTimeSelect
                                    timeIntervals={15}
                                    dateFormat="dd.MM.yyyy. HH:mm"
                                    placeholderText="Odaberi datum i vrijeme"
                                    className="h-12 w-full rounded-lg border border-beige px-4 outline-none focus:ring-2 focus:ring-gold/40"
                                />
                            </div>

                            <button
                                onClick={createAppt}
                                disabled={busy}
                                className="h-12 rounded-lg bg-gold px-8 font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                            >
                                {busy ? "Spremam…" : "Rezerviraj"}
                            </button>
                        </div>
                    </section>
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
                            <p className="text-sm text-gray-500">
                                Odaberi uslugu i datum iznad za prvu rezervaciju! ☝️
                            </p>
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
                                        Datum
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
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                                                a.status === "CANCELLED"
                                                                    ? "bg-gray-100 text-gray-700 border border-gray-300"
                                                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            }`}
                                                        >
                                                            {a.status ?? "BOOKED"}
                                                        </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {lock ? (
                                                        <span className="text-xs italic text-gray-500">
                                                                Nije moguće otkazati (&lt; 24h)
                                                            </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => cancelAppt(a.id)}
                                                            className="rounded-lg border border-red-300 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                                                        >
                                                            Otkaži
                                                        </button>
                                                    )}
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
        </div>
    );
}