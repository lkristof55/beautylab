"use client";

import { useState } from "react";

interface Appointment {
    id: string;
    service: string;
    date: string;
    user?: { name: string; email: string };
}

interface EditAppointmentFormProps {
    appointment: Appointment;
    onSave: (date: string, service: string) => void;
    onCancel: () => void;
}

const SERVICES = [
    "Manikura",
    "Gel nokti",
    "Pedikura",
    "Depilacija - noge",
    "Depilacija - bikini",
    "Masaža",
    "Trepavice",
    "Obrve"
];

export default function EditAppointmentForm({ appointment, onSave, onCancel }: EditAppointmentFormProps) {
    const [date, setDate] = useState(new Date(appointment.date).toISOString().slice(0, 16));
    const [service, setService] = useState(appointment.service);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(date, service);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Usluga
                </label>
                <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid var(--beige)",
                        borderRadius: "8px",
                        fontSize: "1rem",
                    }}
                >
                    {SERVICES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Datum i vrijeme
                </label>
                <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid var(--beige)",
                        borderRadius: "8px",
                        fontSize: "1rem",
                    }}
                />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Spremi
                </button>
                <button type="button" className="btn btn-outline" onClick={onCancel} style={{ flex: 1 }}>
                    Odustani
                </button>
            </div>
        </form>
    );
}

