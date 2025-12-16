"use client";

import { useState, useEffect } from "react";
import { toast } from "./Toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SERVICES_CONFIG } from "@/lib/services";

interface Appointment {
    id: string;
    service: string;
    date: string;
    isCompleted: boolean;
    discountApplied?: number | null;
    user?: {
        id: string;
        name: string;
        email: string;
    } | null;
    assignedEmployee?: {
        id: string;
        name: string;
    } | null;
}

export default function CashRegister() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [applyingDiscount, setApplyingDiscount] = useState(false);

    useEffect(() => {
        fetchCompletedAppointments();
    }, [selectedDate]);

    const fetchCompletedAppointments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/admin/appointments", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                // Filtriraj samo završene termine za odabrani datum
                const dateStr = selectedDate.toISOString().split("T")[0];
                const filtered = data.filter((apt: Appointment) => {
                    if (!apt.isCompleted) return false;
                    const aptDate = new Date(apt.date).toISOString().split("T")[0];
                    return aptDate === dateStr;
                });
                setAppointments(filtered);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
            toast.error("Greška pri dohvaćanju termina");
        } finally {
            setLoading(false);
        }
    };

    const applyDiscount = async (discountPercent: number) => {
        if (!selectedAppointment) {
            toast.error("Odaberite termin za primjenu popusta");
            return;
        }

        try {
            setApplyingDiscount(true);
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/admin/appointments/apply-discount", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    appointmentId: selectedAppointment.id,
                    discountPercent: discountPercent,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Popust od ${discountPercent}% uspješno primijenjen!`);
                setSelectedAppointment(null);
                fetchCompletedAppointments();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Greška pri primjeni popusta");
            }
        } catch (error) {
            console.error("Error applying discount:", error);
            toast.error("Greška pri primjeni popusta");
        } finally {
            setApplyingDiscount(false);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("hr-HR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getServicePrice = (service: string): number => {
        return SERVICES_CONFIG[service]?.price || 0;
    };

    const calculateDiscountedPrice = (appointment: Appointment): number => {
        const price = getServicePrice(appointment.service);
        const discount = appointment.discountApplied || 0;
        return Math.max(0, price - discount);
    };

    const totalToday = appointments.reduce((sum, apt) => {
        return sum + calculateDiscountedPrice(apt);
    }, 0);

    return (
        <div style={{ padding: "2rem" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                }}
            >
                <div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
                        Blagajna
                    </h2>
                    <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
                        Primjena popusta na završene termine
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => date && setSelectedDate(date)}
                        dateFormat="dd.MM.yyyy"
                        className="booking-input"
                        style={{ padding: "0.5rem" }}
                    />
                </div>
            </div>

            {/* Statistika za danas */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                }}
            >
                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <div style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
                        Ukupno danas
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#059669" }}>
                        {totalToday.toFixed(2)} kn
                    </div>
                </div>
                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <div style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
                        Broj završenih termina
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>
                        {appointments.length}
                    </div>
                </div>
            </div>

            {/* Popusti */}
            {selectedAppointment && (
                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        marginBottom: "2rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <h3 style={{ marginBottom: "1rem" }}>
                        Primjena popusta na termin
                    </h3>
                    <div style={{ marginBottom: "1rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px" }}>
                        <div style={{ fontWeight: 500, marginBottom: "0.5rem" }}>
                            {selectedAppointment.service}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#666" }}>
                            {formatTime(selectedAppointment.date)} - {selectedAppointment.user?.name || "N/A"}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
                            Cijena: {getServicePrice(selectedAppointment.service).toFixed(2)} kn
                            {selectedAppointment.discountApplied && selectedAppointment.discountApplied > 0 && (
                                <span style={{ color: "#059669", marginLeft: "0.5rem" }}>
                                    (Popust: -{selectedAppointment.discountApplied.toFixed(2)} kn)
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <button
                            onClick={() => applyDiscount(5)}
                            disabled={applyingDiscount}
                            className="btn btn-primary"
                            style={{ minWidth: "100px" }}
                        >
                            {applyingDiscount ? "Primjenjujem..." : "5%"}
                        </button>
                        <button
                            onClick={() => applyDiscount(10)}
                            disabled={applyingDiscount}
                            className="btn btn-primary"
                            style={{ minWidth: "100px" }}
                        >
                            {applyingDiscount ? "Primjenjujem..." : "10%"}
                        </button>
                        <button
                            onClick={() => applyDiscount(20)}
                            disabled={applyingDiscount}
                            className="btn btn-primary"
                            style={{ minWidth: "100px" }}
                        >
                            {applyingDiscount ? "Primjenjujem..." : "20%"}
                        </button>
                        <button
                            onClick={() => setSelectedAppointment(null)}
                            className="btn btn-outline"
                            style={{ minWidth: "100px" }}
                        >
                            Odustani
                        </button>
                    </div>
                </div>
            )}

            {/* Lista završenih termina */}
            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
            >
                {loading ? (
                    <div style={{ padding: "2rem", textAlign: "center" }}>
                        Učitavanje...
                    </div>
                ) : appointments.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                        Nema završenih termina za odabrani datum.
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f5f5f5" }}>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                    Vrijeme
                                </th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                    Usluga
                                </th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                    Korisnik
                                </th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                    Cijena
                                </th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                    Popust
                                </th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                    Akcija
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((appointment) => {
                                const price = getServicePrice(appointment.service);
                                const discount = appointment.discountApplied || 0;
                                const finalPrice = calculateDiscountedPrice(appointment);
                                const isSelected = selectedAppointment?.id === appointment.id;

                                return (
                                    <tr
                                        key={appointment.id}
                                        style={{
                                            borderTop: "1px solid #eee",
                                            background: isSelected ? "#f0f9ff" : "white",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => setSelectedAppointment(appointment)}
                                    >
                                        <td style={{ padding: "1rem" }}>
                                            {formatTime(appointment.date)}
                                        </td>
                                        <td style={{ padding: "1rem", fontWeight: 500 }}>
                                            {appointment.service}
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontWeight: 500 }}>
                                                {appointment.user?.name || "N/A"}
                                            </div>
                                            <div style={{ fontSize: "0.875rem", color: "#666" }}>
                                                {appointment.user?.email || ""}
                                            </div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontWeight: 600 }}>
                                                {finalPrice.toFixed(2)} kn
                                            </div>
                                            {discount > 0 && (
                                                <div style={{ fontSize: "0.875rem", color: "#666", textDecoration: "line-through" }}>
                                                    {price.toFixed(2)} kn
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            {discount > 0 ? (
                                                <span style={{ color: "#059669", fontWeight: 500 }}>
                                                    -{discount.toFixed(2)} kn
                                                </span>
                                            ) : (
                                                <span style={{ color: "#999" }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedAppointment(appointment);
                                                }}
                                                className="btn btn-sm btn-outline"
                                                style={{ minWidth: "80px" }}
                                            >
                                                {isSelected ? "Odabran" : "Odaberi"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
