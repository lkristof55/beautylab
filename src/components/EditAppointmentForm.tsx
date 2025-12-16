"use client";

import { useState } from "react";

interface Appointment {
    id: string;
    service: string;
    date: string;
    user?: { name: string; email: string };
    assignedEmployee?: { id: string; name: string; email: string } | null;
    assignedEmployeeId?: string | null;
}

interface Employee {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
}

interface EditAppointmentFormProps {
    appointment: Appointment;
    employees?: Employee[];
    onSave: (date: string, service: string, assignedEmployeeId?: string) => void;
    onCancel: () => void;
}

const SERVICES = [
    "Manikura",
    "Gel nokti",
    "Pedikura",
    "Depilacija - noge",
    "Depilacija - bikini",
    "Masaža"
];

export default function EditAppointmentForm({ appointment, employees = [], onSave, onCancel }: EditAppointmentFormProps) {
    const [date, setDate] = useState(new Date(appointment.date).toISOString().slice(0, 16));
    const [service, setService] = useState(appointment.service);
    const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>(appointment.assignedEmployeeId || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(date, service, assignedEmployeeId || undefined);
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
            {employees.length > 0 && (
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Dodijeljeni zaposlenik
                    </label>
                    <select
                        value={assignedEmployeeId}
                        onChange={(e) => setAssignedEmployeeId(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid var(--beige)",
                            borderRadius: "8px",
                            fontSize: "1rem",
                        }}
                    >
                        <option value="">Nije dodijeljen</option>
                        {employees.filter(emp => emp.isActive).map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
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

