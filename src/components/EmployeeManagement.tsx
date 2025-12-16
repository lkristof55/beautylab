"use client";

import { useState, useEffect } from "react";
import { toast } from "./Toast";

interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
    _count?: {
        appointments: number;
    };
}

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/admin/employees", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setEmployees(data.employees || []);
            } else {
                toast.error("Greška pri dohvaćanju zaposlenika");
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            toast.error("Greška pri dohvaćanju zaposlenika");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            toast.error("Ime i email su obavezni");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const url = editingEmployee
                ? "/api/admin/employees"
                : "/api/admin/employees";
            const method = editingEmployee ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(
                    editingEmployee
                        ? { id: editingEmployee.id, ...formData }
                        : formData
                ),
            });

            if (res.ok) {
                toast.success(
                    editingEmployee
                        ? "Zaposlenik uspješno ažuriran"
                        : "Zaposlenik uspješno kreiran"
                );
                setShowForm(false);
                setEditingEmployee(null);
                setFormData({ name: "", email: "", phone: "" });
                fetchEmployees();
            } else {
                const error = await res.json();
                toast.error(error.error || "Greška pri spremanju zaposlenika");
            }
        } catch (error) {
            console.error("Error saving employee:", error);
            toast.error("Greška pri spremanju zaposlenika");
        }
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setFormData({
            name: employee.name,
            email: employee.email,
            phone: employee.phone || "",
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Jeste li sigurni da želite deaktivirati ovog zaposlenika?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`/api/admin/employees?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success("Zaposlenik uspješno deaktiviran");
                fetchEmployees();
            } else {
                const error = await res.json();
                toast.error(error.error || "Greška pri deaktivaciji zaposlenika");
            }
        } catch (error) {
            console.error("Error deleting employee:", error);
            toast.error("Greška pri deaktivaciji zaposlenika");
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "2rem" }}>
                <p>Učitavanje zaposlenika...</p>
            </div>
        );
    }

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
                        Upravljanje zaposlenicima
                    </h2>
                    <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
                        Dodajte, uredite ili deaktivirate zaposlenike
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(true);
                        setEditingEmployee(null);
                        setFormData({ name: "", email: "", phone: "" });
                    }}
                    className="btn btn-primary"
                    style={{ minWidth: "180px" }}
                >
                    + Dodaj zaposlenika
                </button>
            </div>

            {showForm && (
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
                        {editingEmployee ? "Uredi zaposlenika" : "Novi zaposlenik"}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                Ime i prezime
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.5rem",
                                    border: "1px solid #ddd",
                                    borderRadius: "0.25rem",
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.5rem",
                                    border: "1px solid #ddd",
                                    borderRadius: "0.25rem",
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                Telefon (opcionalno)
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                                style={{
                                    width: "100%",
                                    padding: "0.5rem",
                                    border: "1px solid #ddd",
                                    borderRadius: "0.25rem",
                                }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button type="submit" className="btn btn-primary">
                                {editingEmployee ? "Spremi promjene" : "Kreiraj zaposlenika"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingEmployee(null);
                                    setFormData({ name: "", email: "", phone: "" });
                                }}
                                className="btn btn-outline"
                            >
                                Odustani
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
            >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f5f5f5" }}>
                            <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                Ime
                            </th>
                            <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                Email
                            </th>
                            <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                Telefon
                            </th>
                            <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                Termina
                            </th>
                            <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>
                                Status
                            </th>
                            <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600 }}>
                                Akcije
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee) => (
                            <tr
                                key={employee.id}
                                style={{
                                    borderTop: "1px solid #eee",
                                }}
                            >
                                <td style={{ padding: "1rem" }}>{employee.name}</td>
                                <td style={{ padding: "1rem" }}>{employee.email}</td>
                                <td style={{ padding: "1rem" }}>
                                    {employee.phone || "-"}
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    {employee._count?.appointments || 0}
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    <span
                                        style={{
                                            display: "inline-block",
                                            padding: "0.25rem 0.75rem",
                                            borderRadius: "0.25rem",
                                            background: employee.isActive
                                                ? "#d1fae5"
                                                : "#fee2e2",
                                            color: employee.isActive ? "#065f46" : "#991b1b",
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {employee.isActive ? "Aktivan" : "Neaktivan"}
                                    </span>
                                </td>
                                <td style={{ padding: "1rem", textAlign: "right" }}>
                                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                        <button
                                            onClick={() => handleEdit(employee)}
                                            className="btn btn-outline btn-sm"
                                            style={{ minWidth: "auto" }}
                                        >
                                            Uredi
                                        </button>
                                        {employee.isActive && (
                                            <button
                                                onClick={() => handleDelete(employee.id)}
                                                className="btn btn-outline btn-sm"
                                                style={{
                                                    minWidth: "auto",
                                                    color: "#dc2626",
                                                    borderColor: "#dc2626",
                                                }}
                                            >
                                                Deaktiviraj
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                                    Nema zaposlenika. Dodajte prvog zaposlenika.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}





