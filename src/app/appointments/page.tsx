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
            const res = await fetch(`/api/appointments/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
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
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-gray-600">Učitavanje…</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl px-4">
            {/* Bijela ploha iza svega – da ne “tonu” preko fotke ako je igdje ostala */}
            <div className="rounded-2xl border bg-white/95 backdrop-blur shadow-sm p-6 md:p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-semibold">📅 Moji termini</h1>
                    <p className="text-sm text-gray-600">Upravljaj rezervacijama — brzo i jednostavno.</p>
                </div>

                {msg && (
                    <div
                        className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                            msg.type === "ok"
                                ? "border-green-300 bg-green-50 text-green-800"
                                : "border-red-300 bg-red-50 text-red-800"
                        }`}
                    >
                        {msg.text}
                    </div>
                )}

                {/* Novi termin */}
                <section className="mb-10">
                    <h2 className="mb-3 text-lg font-medium text-gold">+ Novi termin</h2>
                    <div className="grid gap-3 sm:grid-cols-[1fr_260px_auto]">
                        <select
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 outline-none focus:ring-2 focus:ring-gold/40"
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
                                className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:ring-2 focus:ring-gold/40"
                            />
                        </div>

                        <button
                            onClick={createAppt}
                            disabled={busy}
                            className="h-11 rounded-lg bg-gold px-6 font-medium text-white transition hover:brightness-95 disabled:opacity-60"
                        >
                            {busy ? "Spremam…" : "Rezerviraj"}
                        </button>
                    </div>
                </section>

                {/* Lista termina */}
                <section>
                    <h2 className="mb-3 text-lg font-medium">Termini</h2>

                    {appointments.length === 0 ? (
                        <div className="rounded-lg border bg-porcelain/40 px-4 py-8 text-center text-gray-600">
                            Nemaš još rezerviranih termina.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] border-separate border-spacing-0">
                                <thead>
                                <tr className="bg-porcelain/70 text-left text-sm text-gray-700">
                                    <th className="px-4 py-3 font-semibold">Usluga</th>
                                    <th className="px-4 py-3 font-semibold">Datum</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold text-right">Akcija</th>
                                </tr>
                                </thead>
                                <tbody>
                                {appointments
                                    .slice()
                                    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
                                    .map((a, i) => {
                                        const zebra = i % 2 === 0 ? "bg-white" : "bg-porcelain/40";
                                        const lock = within24h(a.date);
                                        return (
                                            <tr key={a.id} className={`${zebra} text-sm`}>
                                                <td className="px-4 py-3">{a.service}</td>
                                                <td className="px-4 py-3">
                                                    {new Date(a.date).toLocaleString("hr-HR", {
                                                        dateStyle: "short",
                                                        timeStyle: "short",
                                                    })}
                                                </td>
                                                <td className="px-4 py-3">
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${
                                    a.status === "CANCELLED"
                                        ? "bg-gray-100 text-gray-700 border border-gray-300"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                            >
                              {a.status ?? "BOOKED"}
                            </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {lock ? (
                                                        <span className="text-xs italic text-gray-500">Nije moguće otkazati (&lt; 24h)</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => cancelAppt(a.id)}
                                                            className="rounded-lg border px-3 py-1.5 text-sm transition hover:bg-porcelain/60"
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
                </section>
            </div>
        </div>
    );
}
