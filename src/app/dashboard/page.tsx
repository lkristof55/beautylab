"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
    id: string;
    service: string;
    date: string;
    status?: "BOOKED" | "CANCELLED" | "DONE";
};

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState<{ name: string; email: string; createdAt: string } | null>(null);
    const [appts, setAppts] = useState<Appointment[]>([]);
    const router = useRouter();

    // helper
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.replace("/login");
            return;
        }

        const run = async () => {
            try {
                // 1) profil
                const r1 = await fetch("/api/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!r1.ok) throw new Error("Greška profila");
                const { user } = await r1.json();
                setMe(user);

                // 2) moji termini
                const r2 = await fetch("/api/appointments", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (r2.ok) {
                    const data = await r2.json();
                    setAppts(data.appointments || []);
                } else {
                    setAppts([]); // nema termina / endpoint još nije gotov
                }
            } catch (e) {
                console.error(e);
                localStorage.removeItem("token");
                router.replace("/login");
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [router, token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
    };

    const handleCancel = async (id: string) => {
        if (!token) return;
        const sure = confirm("Želiš otkazati ovaj termin?");
        if (!sure) return;

        const res = await fetch("/api/appointments", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ appointmentId: id }),
        });

        if (res.ok) {
            setAppts((prev) => prev.filter((a) => a.id !== id));
        } else {
            const data = await res.json();
            alert(data.error || "Greška pri otkazivanju");
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-gray-600">Učitavanje...</p>
            </div>
        );
    }

    if (!me) return null;

    return (
        <section className="min-h-screen bg-porcelain flex justify-center py-10 px-4">
            <div className="w-full max-w-5xl">
                {/* Header kartica */}
                <div className="bg-white border border-[var(--beige)] rounded-2xl shadow-soft p-6 mb-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">
                                Tvoj dashboard, <span className="text-gold">{me.name}</span>
                            </h1>
                            <p className="text-[var(--color-on-surface-secondary)] mt-1">{me.email}</p>
                            <p className="text-sm text-[var(--color-on-surface-secondary)]">
                                Član od: {new Date(me.createdAt).toLocaleDateString("hr-HR")}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push("/book")}
                                className="btn btn-primary"
                            >
                                + Rezerviraj termin
                            </button>
                            <button onClick={handleLogout} className="btn btn-outline">
                                Odjavi se
                            </button>
                        </div>
                    </div>
                </div>

                {/* Termini */}
                <div className="bg-white border border-[var(--beige)] rounded-2xl shadow-soft p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gold">📅 Moji termini</h2>

                    {appts.length === 0 ? (
                        <div className="text-center text-[var(--color-on-surface-secondary)] py-10">
                            Nemaš još rezerviranih termina.
                            <div className="mt-4">
                                <button onClick={() => router.push("/book")} className="btn btn-primary btn-sm">
                                    Rezerviraj prvi termin
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border border-[var(--beige)] rounded-lg text-left">
                                <thead className="bg-blush">
                                <tr>
                                    <th className="p-3">Usluga</th>
                                    <th className="p-3">Datum</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-center">Akcija</th>
                                </tr>
                                </thead>
                                <tbody>
                                {appts.map((a) => {
                                    const canCancel =
                                        new Date(a.date).getTime() - Date.now() > 24 * 60 * 60 * 1000;
                                    return (
                                        <tr key={a.id} className="border-t hover:bg-[rgba(248,231,231,0.25)]">
                                            <td className="p-3">{a.service}</td>
                                            <td className="p-3">
                                                {new Date(a.date).toLocaleString("hr-HR", {
                                                    dateStyle: "short",
                                                    timeStyle: "short",
                                                })}
                                            </td>
                                            <td className="p-3">{a.status ?? "BOOKED"}</td>
                                            <td className="p-3 text-center">
                                                {canCancel ? (
                                                    <button
                                                        onClick={() => handleCancel(a.id)}
                                                        className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                                                    >
                                                        Otkaži
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">
                              Nije moguće otkazati (&lt; 24h)
                            </span>
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
        </section>
    );
}
