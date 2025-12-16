"use client";

import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "@/context/AuthContext";
import { SERVICES_CONFIG, SERVICES } from "@/lib/services";

type Appointment = {
    id: string;
    service: string;
    date: string;
    duration?: number;
};

export default function BookAppointmentModal({
    open,
    onClose,
    onSuccess
}: {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}) {
    const { user } = useAuth();
    const [selectedService, setSelectedService] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    // Fetch appointments kada se modal otvori
    useEffect(() => {
        if (open && user) {
            fetchAppointments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user]);

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/appointments", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setAppointments(data.appointments || []);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    };

    const resetForm = () => {
        setSelectedService("");
        setSelectedDate(null);
        setSelectedTime("");
        setMsg(null);
    };

    const generateTimeSlots = () => {
        const slots: string[] = [];
        for (let hour = 9; hour < 19; hour++) {
            for (let min = 0; min < 60; min += 30) {
                slots.push(
                    `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`
                );
            }
        }
        return slots;
    };

    const isTimeSlotAvailable = (date: Date, time: string, duration: number, service: string) => {
        const [h, m] = time.split(":").map(Number);
        const slotStart = new Date(date);
        slotStart.setHours(h, m, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        // Provjeri maxConcurrent za odabranu uslugu
        const serviceConfig = SERVICES_CONFIG[service as keyof typeof SERVICES_CONFIG];
        const maxConcurrent = serviceConfig?.maxConcurrent || 1;

        // Broji koliko termina iste usluge već postoji u tom vremenskom slotu
        const concurrentCount = appointments.filter((apt) => {
            if (apt.service !== service) return false;
            const aptStart = new Date(apt.date);
            const aptEnd = new Date(
                aptStart.getTime() + (apt.duration || 60) * 60000
            );
            return slotStart < aptEnd && slotEnd > aptStart;
        }).length;

        return concurrentCount < maxConcurrent;
    };

    const createAppt = async () => {
        if (!selectedService || !selectedDate || !selectedTime) {
            setMsg("Molimo ispunite sve podatke.");
            return;
        }

        setBusy(true);
        setMsg(null);

        const token = localStorage.getItem("token");
        if (!token) {
            setMsg("Niste prijavljeni.");
            setBusy(false);
            return;
        }

        const [h, m] = selectedTime.split(":").map(Number);
        const apptDate = new Date(selectedDate);
        apptDate.setHours(h, m, 0, 0);

        const duration = SERVICES_CONFIG[selectedService as keyof typeof SERVICES_CONFIG].duration;

        try {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    service: selectedService,
                    date: apptDate.toISOString(),
                    duration
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Greška pri spremanju termina.");
            }

            resetForm();
            if (onSuccess) onSuccess();
            onClose();
        } catch (e: any) {
            setMsg(e.message || "Greška pri spremanju termina.");
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    // Handler za overlay - zatvori modal samo ako se klikne direktno na overlay
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Zatvori modal samo ako se klikne direktno na overlay (ne na modal ili njegov sadržaj)
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="booking-modal-overlay" onClick={handleOverlayClick}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                <div className="booking-modal-header">
                    <h2 style={{ 
                        fontSize: "var(--font-size-xl)", 
                        marginBottom: 0,
                        color: "var(--color-on-surface)",
                        fontFamily: "var(--font-family-heading)",
                        fontWeight: 700
                    }}>
                        Rezerviraj termin
                    </h2>
                    <button
                        onClick={onClose}
                        className="booking-modal-close"
                        aria-label="Zatvori"
                    >
                        ×
                    </button>
                </div>

                <div className="booking-modal-body">
                    {msg && (
                        <div className={`booking-msg ${msg.includes("Greška") ? "error" : "success"}`}>
                            {msg}
                        </div>
                    )}

                    {/* Service */}
                    <div className="booking-field">
                        <label className="booking-label">Usluga</label>
                        <select
                            className="booking-input"
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                        >
                            <option value="">Odaberi uslugu...</option>
                            {SERVICES.map((s) => (
                                <option key={s} value={s}>
                                    {s} ({SERVICES_CONFIG[s as keyof typeof SERVICES_CONFIG].duration} min)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    {selectedService && (
                        <div className="booking-field">
                            <label className="booking-label">Datum</label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(d) => setSelectedDate(d)}
                                minDate={new Date()}
                                className="booking-input"
                                dateFormat="dd.MM.yyyy."
                                placeholderText="Odaberi datum..."
                            />
                        </div>
                    )}

                    {/* Time */}
                    {selectedDate && (
                        <div className="booking-field">
                            <label className="booking-label">Vrijeme</label>
                            <div className="booking-times">
                                {generateTimeSlots().map((time) => {
                                    const duration =
                                        SERVICES_CONFIG[selectedService as keyof typeof SERVICES_CONFIG].duration;
                                    const available = isTimeSlotAvailable(
                                        selectedDate,
                                        time,
                                        duration,
                                        selectedService
                                    );
                                    return (
                                        <button
                                            key={time}
                                            type="button"
                                            className={`booking-time ${
                                                selectedTime === time ? "active" : ""
                                            } ${!available ? "disabled" : ""}`}
                                            disabled={!available}
                                            onClick={() => available && setSelectedTime(time)}
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="booking-modal-footer">
                    <button
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className="btn btn-outline"
                    >
                        Odustani
                    </button>

                    <button
                        onClick={createAppt}
                        disabled={!selectedService || !selectedDate || !selectedTime || busy}
                        className="btn btn-primary"
                    >
                        {busy ? "Spremam..." : "Potvrdi rezervaciju"}
                    </button>
                </div>
            </div>
        </div>
    );
}

