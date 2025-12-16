"use client";

import { useState, useEffect } from "react";
import { toast } from "./Toast";
import EditAppointmentForm from "./EditAppointmentForm";

interface Appointment {
    id: string;
    service: string;
    date: string;
    user?: { name: string; email: string };
    assignedEmployee?: { id: string; name: string; email: string } | null;
    assignedEmployeeId?: string | null;
    isCompleted?: boolean;
    pointsEarned?: number;
    unregisteredName?: string | null;
    unregisteredPhone?: string | null;
}

interface DayAppointmentsModalProps {
    open: boolean;
    onClose: () => void;
    date: Date | null;
    appointments: Appointment[];
    onAppointmentClick?: (appointment: Appointment) => void;
    onCreateNew?: (date: Date) => void;
    onComplete?: (appointmentId: string) => Promise<void>;
    onUncomplete?: (appointmentId: string) => Promise<void>;
    onUpdate?: (appointmentId: string, date: string, service: string, assignedEmployeeId?: string) => Promise<void>;
    onDelete?: (appointmentId: string) => Promise<void>;
    onRefresh?: () => void;
}

interface Employee {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
}

export default function DayAppointmentsModal({
    open,
    onClose,
    date,
    appointments,
    onAppointmentClick,
    onCreateNew,
    onComplete,
    onUncomplete,
    onUpdate,
    onDelete,
    onRefresh,
}: DayAppointmentsModalProps) {
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [editingAppointment, setEditingAppointment] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        if (open && onUpdate) {
            fetchEmployees();
        }
    }, [open, onUpdate]);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/admin/employees", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setEmployees(data.employees || []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    if (!open || !date) return null;

    const dayAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        const selectedDate = new Date(date);
        return (
            aptDate.getDate() === selectedDate.getDate() &&
            aptDate.getMonth() === selectedDate.getMonth() &&
            aptDate.getFullYear() === selectedDate.getFullYear()
        );
    });

    const handleAppointmentClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setEditingAppointment(false);
        setDeleteConfirm(false);
    };

    const handleComplete = async () => {
        if (!selectedAppointment || !onComplete) return;
        await onComplete(selectedAppointment.id);
        setSelectedAppointment(null);
        if (onRefresh) onRefresh();
    };

    const handleUpdate = async (date: string, service: string, assignedEmployeeId?: string) => {
        if (!selectedAppointment || !onUpdate) return;
        await onUpdate(selectedAppointment.id, date, service, assignedEmployeeId);
        setEditingAppointment(false);
        setSelectedAppointment(null);
        if (onRefresh) onRefresh();
    };

    const handleDelete = async () => {
        if (!selectedAppointment || !onDelete) return;
        await onDelete(selectedAppointment.id);
        setDeleteConfirm(false);
        setSelectedAppointment(null);
        if (onRefresh) onRefresh();
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("hr-HR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("hr-HR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    // Handler za overlay - zatvori modal samo ako se klikne direktno na overlay
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Zatvori modal samo ako se klikne direktno na overlay (ne na modal ili njegov sadržaj)
        if (e.target === e.currentTarget && !selectedAppointment) {
            onClose();
        }
    };

    return (
        <div
            className="modal-overlay"
            onClick={handleOverlayClick}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
        >
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "2rem",
                    maxWidth: "700px",
                    width: "90%",
                    maxHeight: "85vh",
                    overflowY: "auto",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {!selectedAppointment ? (
                    <>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--graphite)" }}>
                                Termini za {formatDate(date)}
                            </h2>
                            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                                <p style={{ color: "#6e6e6e", fontSize: "0.9rem", margin: 0 }}>
                                    {dayAppointments.length} {dayAppointments.length === 1 ? "termin" : "termina"}
                                </p>
                                {dayAppointments.filter(apt => !apt.isCompleted).length > 0 && (
                                    <span style={{
                                        background: "#fef2f2",
                                        color: "#e07e9e",
                                        padding: "0.25rem 0.75rem",
                                        borderRadius: "12px",
                                        fontSize: "0.875rem",
                                        fontWeight: 500
                                    }}>
                                        ⚠️ {dayAppointments.filter(apt => !apt.isCompleted).length} nedovršen{dayAppointments.filter(apt => !apt.isCompleted).length === 1 ? "" : "ih"}
                                    </span>
                                )}
                            </div>
                        </div>

                        {dayAppointments.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "3rem 1rem",
                                    color: "#6e6e6e",
                                }}
                            >
                                <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Nema termina za ovaj dan</p>
                                {onCreateNew && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            onCreateNew(date);
                                            onClose();
                                        }}
                                    >
                                        + Dodaj novi termin
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem", flex: 1, overflowY: "auto" }}>
                                {dayAppointments
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            onClick={() => handleAppointmentClick(appointment)}
                                            style={{
                                                background: appointment.isCompleted ? "#f0fdf4" : "#fef2f2",
                                                border: `2px solid ${appointment.isCompleted ? "#10b981" : "#e07e9e"}`,
                                                borderRadius: "12px",
                                                padding: "1.25rem",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "none";
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                                    <span
                                                        style={{
                                                            fontSize: "1.1rem",
                                                            fontWeight: 600,
                                                            color: appointment.isCompleted ? "#10b981" : "#e07e9e",
                                                        }}
                                                    >
                                                        {formatTime(appointment.date)}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: "0.875rem",
                                                            padding: "0.25rem 0.75rem",
                                                            borderRadius: "20px",
                                                            background: appointment.isCompleted ? "#10b981" : "#e07e9e",
                                                            color: "white",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {appointment.isCompleted ? "✅ Završen" : "⏳ Na čekanju"}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--graphite)" }}>
                                                    {appointment.service}
                                                </p>
                                        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#6e6e6e" }}>
                                            {appointment.user?.name || (appointment as any).unregisteredName || "N/A"} 
                                            {appointment.user?.email && ` (${appointment.user.email})`}
                                            {(appointment as any).unregisteredPhone && ` (${(appointment as any).unregisteredPhone})`}
                                        </p>
                                        {appointment.assignedEmployee && (
                                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#059669", fontWeight: 500 }}>
                                                👤 {appointment.assignedEmployee.name}
                                            </p>
                                        )}
                                                {appointment.isCompleted && appointment.pointsEarned && (
                                                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "#10b981", fontWeight: 500 }}>
                                                        💎 {appointment.pointsEarned} bodova
                                                    </p>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "1.5rem",
                                                    color: appointment.isCompleted ? "#10b981" : "#e07e9e",
                                                }}
                                            >
                                                →
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--beige)" }}>
                            {onCreateNew && dayAppointments.length > 0 && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        onCreateNew(date);
                                        onClose();
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    + Dodaj novi termin
                                </button>
                            )}
                            <button className="btn btn-outline" onClick={onClose} style={{ flex: onCreateNew && dayAppointments.length > 0 ? 1 : "none", width: onCreateNew && dayAppointments.length > 0 ? "auto" : "100%" }}>
                                Zatvori
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0, color: "var(--graphite)" }}>
                                Detalji termina
                            </h2>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={() => setSelectedAppointment(null)}
                                style={{ padding: "0.5rem 1rem" }}
                            >
                                ← Natrag
                            </button>
                        </div>

                        {!editingAppointment && !deleteConfirm && (
                            <>
                                <div style={{ marginBottom: "1.5rem" }}>
                                    <p><strong>Usluga:</strong> {selectedAppointment.service}</p>
                                    <p><strong>Datum i vrijeme:</strong> {new Date(selectedAppointment.date).toLocaleString("hr-HR")}</p>
                                    <p><strong>Korisnik:</strong> {selectedAppointment.user?.name || "N/A"} ({selectedAppointment.user?.email || "N/A"})</p>
                                    {selectedAppointment.assignedEmployee && (
                                        <p><strong>Dodijeljeni zaposlenik:</strong> {selectedAppointment.assignedEmployee.name}</p>
                                    )}
                                    <p><strong>Status:</strong> {selectedAppointment.isCompleted ? "✅ Završen" : "⏳ Na čekanju"}</p>
                                    {selectedAppointment.isCompleted && selectedAppointment.pointsEarned && (
                                        <p><strong>Dobiveni bodovi:</strong> {selectedAppointment.pointsEarned}</p>
                                    )}
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    {!selectedAppointment.isCompleted && onComplete && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleComplete}
                                            style={{ width: "100%" }}
                                        >
                                            ✅ Označi kao završen
                                        </button>
                                    )}
                                    {selectedAppointment.isCompleted && onUncomplete && (
                                        <button
                                            className="btn btn-outline"
                                            onClick={handleUncomplete}
                                            style={{ width: "100%", color: "#ef4444", borderColor: "#ef4444" }}
                                        >
                                            ❌ Označi kao neizvršen
                                        </button>
                                    )}
                                    {onUpdate && (
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => setEditingAppointment(true)}
                                            style={{ width: "100%" }}
                                        >
                                            ✏️ Uredi termin
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => setDeleteConfirm(true)}
                                            style={{ width: "100%", color: "#ef4444", borderColor: "#ef4444" }}
                                        >
                                            🗑️ Obriši termin
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {editingAppointment && selectedAppointment && onUpdate && (
                            <EditAppointmentForm
                                appointment={selectedAppointment}
                                employees={employees}
                                onSave={(date, service, assignedEmployeeId) => {
                                    handleUpdate(date, service, assignedEmployeeId);
                                }}
                                onCancel={() => setEditingAppointment(false)}
                            />
                        )}

                        {deleteConfirm && selectedAppointment && onDelete && (
                            <div>
                                <p style={{ marginBottom: "1rem", color: "#ef4444" }}>
                                    Jeste li sigurni da želite obrisati ovaj termin?
                                </p>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleDelete}
                                        style={{ flex: 1, background: "#ef4444", borderColor: "#ef4444" }}
                                    >
                                        Da, obriši
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setDeleteConfirm(false)}
                                        style={{ flex: 1 }}
                                    >
                                        Odustani
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

