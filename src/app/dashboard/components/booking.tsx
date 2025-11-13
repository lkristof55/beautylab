"use client";

import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Appointment = {
    id: string;
    service: string;
    date: string;
    duration?: number;
};

const SERVICES_CONFIG = {
    "Manikura": { duration: 45, price: 35 },
    "Gel nokti": { duration: 90, price: 55 },
    "Pedikura": { duration: 60, price: 45 },
    "Depilacija - noge": { duration: 45, price: 40 },
    "Depilacija - bikini": { duration: 30, price: 30 },
    "Masaža": { duration: 60, price: 60 },
    "Trepavice": { duration: 90, price: 80 },
    "Obrve": { duration: 30, price: 25 }
};

const SERVICES = Object.keys(SERVICES_CONFIG);

export default function BookAppointmentSidebar({
                                                   open,
                                                   onClose,
                                                   token,
                                                   appointments,
                                                   refresh
                                               }: {
    open: boolean;
    onClose: () => void;
    token: string;
    appointments: Appointment[];
    refresh: () => void;
}) {

    const [selectedService, setSelectedService] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

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

    const isTimeSlotAvailable = (date: Date, time: string, duration: number) => {
        const [h, m] = time.split(":").map(Number);
        const slotStart = new Date(date);
        slotStart.setHours(h, m, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        return !appointments.some((apt) => {
            const aptStart = new Date(apt.date);
            const aptEnd = new Date(
                aptStart.getTime() + (apt.duration || 60) * 60000
            );
            return slotStart < aptEnd && slotEnd > aptStart;
        });
    };

    const createAppt = async () => {
        if (!selectedService || !selectedDate || !selectedTime) {
            setMsg("Molimo ispunite sve podatke.");
            return;
        }

        setBusy(true);
        setMsg(null);

        const [h, m] = selectedTime.split(":").map(Number);
        const apptDate = new Date(selectedDate);
        apptDate.setHours(h, m, 0, 0);

        const duration = SERVICES_CONFIG[selectedService].duration;

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

            if (!res.ok) throw new Error();

            onClose();
            refresh();

        } catch (e) {
            setMsg("Greška pri spremanju termina.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={`booking-sidebar-overlay ${open ? "open" : ""}`}>
            <div className={`booking-sidebar ${open ? "open" : ""}`}>
                {/* HEADER */}
                <div className="booking-header">
                    <h2>Novi termin</h2>

                </div>

                {/* BODY */}
                <div className="booking-body">
                    {msg && <div className="booking-msg">{msg}</div>}

                    {/* Service */}
                    <label>Usluga</label>
                    <select
                        className="booking-input"
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                    >
                        <option value="">Odaberi...</option>
                        {SERVICES.map((s) => (
                            <option key={s} value={s}>
                                {s} ({SERVICES_CONFIG[s].duration} min)
                            </option>
                        ))}
                    </select>

                    {/* Date */}
                    {selectedService && (
                        <>
                            <label style={{ marginTop: "1rem" }}>Datum</label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(d) => setSelectedDate(d)}
                                minDate={new Date()}
                                className="booking-input"
                                dateFormat="dd.MM.yyyy."
                            />
                        </>
                    )}

                    {/* Time */}
                    {selectedDate && (
                        <>
                            <label style={{ marginTop: "1rem" }}>Vrijeme</label>
                            <div className="booking-times">
                                {generateTimeSlots().map((time) => {
                                    const duration =
                                        SERVICES_CONFIG[selectedService].duration;
                                    const available = isTimeSlotAvailable(
                                        selectedDate,
                                        time,
                                        duration
                                    );
                                    return (
                                        <button
                                            key={time}
                                            className={`booking-time ${
                                                selectedTime === time
                                                    ? "active"
                                                    : ""
                                            }`}
                                            disabled={!available}
                                            onClick={() =>
                                                available && setSelectedTime(time)
                                            }
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* FOOTER */}
                <div className="booking-footer">
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
                        {busy ? "Spremam..." : "Potvrdi"}
                    </button>
                </div>
            </div>
        </div>
    );
}
