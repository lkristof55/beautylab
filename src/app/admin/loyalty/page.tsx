"use client";

import { useState, useEffect } from "react";
import { toast } from "@/components/Toast";

interface User {
    id: string;
    name: string;
    email: string;
    loyaltyPoints: number;
    loyaltyTier: string;
    totalVisits: number;
    totalSpent: number;
}

interface Reward {
    id: string;
    name: string;
    description: string;
    pointsCost: number;
    discount: number | null;
    isActive: boolean;
}

export default function AdminLoyalty() {
    const [users, setUsers] = useState<User[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<"users" | "rewards">("users");
    const [searchTerm, setSearchTerm] = useState("");
    
    // Reward form states
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [rewardForm, setRewardForm] = useState({
        name: "",
        description: "",
        pointsCost: 100,
        discount: 10,
    });

    // User points adjustment
    const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);
    const [pointsAdjustment, setPointsAdjustment] = useState({ points: 0, description: "" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const [usersRes, rewardsRes] = await Promise.all([
                fetch("/api/admin/loyalty", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch("/api/admin/loyalty/rewards", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData.users || []);
            }

            if (rewardsRes.ok) {
                const rewardsData = await rewardsRes.json();
                setRewards(rewardsData.rewards || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const adjustUserPoints = async (userId: string) => {
        if (!pointsAdjustment.points || !pointsAdjustment.description) {
            toast.warning("Unesite bodove i opis");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/admin/loyalty", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId,
                    points: pointsAdjustment.points,
                    description: pointsAdjustment.description,
                    type: "admin_adjust",
                }),
            });

            if (res.ok) {
                toast.success("Bodovi uspješno ažurirani");
                setAdjustingUserId(null);
                setPointsAdjustment({ points: 0, description: "" });
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Greška pri ažuriranju bodova");
            }
        } catch (error) {
            toast.error("Greška pri ažuriranju bodova");
        }
    };

    const saveReward = async () => {
        if (!rewardForm.name || !rewardForm.pointsCost) {
            toast.warning("Unesite naziv i cijenu u bodovima");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const url = editingReward
                ? `/api/admin/loyalty/rewards`
                : `/api/admin/loyalty/rewards`;
            const method = editingReward ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editingReward
                    ? { ...rewardForm, id: editingReward.id }
                    : rewardForm
                ),
            });

            if (res.ok) {
                toast.success(editingReward ? "Nagrada ažurirana" : "Nagrada kreirana");
                setShowRewardModal(false);
                setEditingReward(null);
                setRewardForm({ name: "", description: "", pointsCost: 100, discount: 10 });
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Greška pri spremanju nagrade");
            }
        } catch (error) {
            toast.error("Greška pri spremanju nagrade");
        }
    };

    const toggleRewardActive = async (rewardId: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem("token");
            const reward = rewards.find(r => r.id === rewardId);
            if (!reward) return;

            const res = await fetch("/api/admin/loyalty/rewards", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: rewardId,
                    isActive: !currentStatus,
                }),
            });

            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            toast.error("Greška pri ažuriranju nagrade");
        }
    };

    const deleteReward = async (rewardId: string) => {
        if (!window.confirm("Jeste li sigurni da želite obrisati ovu nagradu?")) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/admin/loyalty/rewards?id=${rewardId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success("Nagrada obrisana");
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Greška pri brisanju nagrade");
            }
        } catch (error) {
            toast.error("Greška pri brisanju nagrade");
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case "Platinum": return "#E5E4E2";
            case "Gold": return "#FFD700";
            case "Silver": return "#C0C0C0";
            default: return "#CD7F32";
        }
    };

    const getTierName = (tier: string) => {
        const names: { [key: string]: string } = {
            "Bronze": "Brončana",
            "Silver": "Srebrna",
            "Gold": "Zlatna",
            "Platinum": "Platinska",
        };
        return names[tier] || tier;
    };

    if (loading) {
        return <div style={{ padding: "2rem", textAlign: "center" }}>Učitavanje...</div>;
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", height: "100%" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "1rem", borderBottom: "2px solid var(--beige)" }}>
                <button
                    onClick={() => setActiveSection("users")}
                    style={{
                        padding: "0.75rem 1.5rem",
                        background: activeSection === "users" ? "var(--rose)" : "transparent",
                        color: activeSection === "users" ? "white" : "var(--graphite)",
                        border: "none",
                        borderBottom: activeSection === "users" ? "2px solid var(--rose)" : "2px solid transparent",
                        cursor: "pointer",
                        fontWeight: 500,
                    }}
                >
                    Korisnici i bodovi
                </button>
                <button
                    onClick={() => setActiveSection("rewards")}
                    style={{
                        padding: "0.75rem 1.5rem",
                        background: activeSection === "rewards" ? "var(--rose)" : "transparent",
                        color: activeSection === "rewards" ? "white" : "var(--graphite)",
                        border: "none",
                        borderBottom: activeSection === "rewards" ? "2px solid var(--rose)" : "2px solid transparent",
                        cursor: "pointer",
                        fontWeight: 500,
                    }}
                >
                    Nagrade i kuponi
                </button>
            </div>

            {/* Users Section */}
            {activeSection === "users" && (
                <div style={{ flex: 1, overflowY: "auto" }}>
                    <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>Upravljanje bodovima</h2>
                        <input
                            type="text"
                            placeholder="Pretraži korisnike po imenu ili emailu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: "0.75rem 1rem",
                                border: "1px solid var(--beige)",
                                borderRadius: "0.5rem",
                                fontSize: "0.9rem",
                                width: "300px",
                                outline: "none",
                                transition: "border-color 0.2s",
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "var(--rose)"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "var(--beige)"}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "1rem" }}>
                        {(() => {
                            const filteredUsers = users.filter((user) => {
                                if (!searchTerm) return true;
                                const search = searchTerm.toLowerCase();
                                return (
                                    user.name.toLowerCase().includes(search) ||
                                    user.email.toLowerCase().includes(search)
                                );
                            });

                            if (filteredUsers.length === 0) {
                                return (
                                    <div style={{
                                        padding: "3rem",
                                        textAlign: "center",
                                        background: "white",
                                        borderRadius: "12px",
                                        color: "var(--graphite)",
                                        opacity: 0.6
                                    }}>
                                        <p style={{ margin: 0, fontSize: "1rem" }}>
                                            {searchTerm
                                                ? `Nema korisnika koji odgovaraju pretraživanju "${searchTerm}"`
                                                : "Nema korisnika"}
                                        </p>
                                    </div>
                                );
                            }

                            return filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                style={{
                                    background: "white",
                                    borderRadius: "12px",
                                    padding: "1.5rem",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                                    gap: "1rem",
                                    alignItems: "center",
                                }}
                            >
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: "1.1rem" }}>{user.name}</p>
                                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#6e6e6e" }}>
                                        {user.email}
                                    </p>
                                </div>

                                <div style={{ textAlign: "center" }}>
                                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)" }}>
                                        {user.loyaltyPoints}
                                    </p>
                                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#6e6e6e" }}>Bodova</p>
                                </div>

                                <div style={{ textAlign: "center" }}>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: "1.1rem",
                                            fontWeight: 600,
                                            color: getTierColor(user.loyaltyTier),
                                        }}
                                    >
                                        {getTierName(user.loyaltyTier)}
                                    </p>
                                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#6e6e6e" }}>Razina</p>
                                </div>

                                <div style={{ textAlign: "center" }}>
                                    <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                                        {user.totalVisits}
                                    </p>
                                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#6e6e6e" }}>Posjeta</p>
                                </div>

                                <button
                                    onClick={() => setAdjustingUserId(adjustingUserId === user.id ? null : user.id)}
                                    className="btn btn-outline btn-sm"
                                >
                                    {adjustingUserId === user.id ? "Odustani" : "Ažuriraj"}
                                </button>

                                {adjustingUserId === user.id && (
                                    <div
                                        style={{
                                            gridColumn: "1 / -1",
                                            marginTop: "1rem",
                                            padding: "1rem",
                                            background: "#f9f9f9",
                                            borderRadius: "8px",
                                            display: "flex",
                                            gap: "1rem",
                                            alignItems: "end",
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                                                Bodovi (može biti negativno za oduzimanje)
                                            </label>
                                            <input
                                                type="number"
                                                value={pointsAdjustment.points}
                                                onChange={(e) =>
                                                    setPointsAdjustment({ ...pointsAdjustment, points: parseInt(e.target.value) || 0 })
                                                }
                                                style={{
                                                    width: "100%",
                                                    padding: "0.5rem",
                                                    border: "1px solid #e0e0e0",
                                                    borderRadius: "6px",
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                                                Opis
                                            </label>
                                            <input
                                                type="text"
                                                value={pointsAdjustment.description}
                                                onChange={(e) =>
                                                    setPointsAdjustment({ ...pointsAdjustment, description: e.target.value })
                                                }
                                                placeholder="Npr. Bonus za lojalnost"
                                                style={{
                                                    width: "100%",
                                                    padding: "0.5rem",
                                                    border: "1px solid #e0e0e0",
                                                    borderRadius: "6px",
                                                }}
                                            />
                                        </div>
                                        <button onClick={() => adjustUserPoints(user.id)} className="btn btn-primary">
                                            Spremi
                                        </button>
                                    </div>
                                )}
                            </div>
                            ));
                        })()}
                    </div>
                </div>
            )}

            {/* Rewards Section */}
            {activeSection === "rewards" && (
                <div style={{ flex: 1, overflowY: "auto" }}>
                    <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>Nagrade i kuponi</h2>
                        <button onClick={() => { setEditingReward(null); setRewardForm({ name: "", description: "", pointsCost: 100, discount: 10 }); setShowRewardModal(true); }} className="btn btn-primary">
                            + Nova nagrada
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                        {rewards.map((reward) => (
                            <div
                                key={reward.id}
                                style={{
                                    background: "white",
                                    borderRadius: "12px",
                                    padding: "1.5rem",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    border: reward.isActive ? "2px solid var(--gold)" : "1px solid #e0e0e0",
                                    opacity: reward.isActive ? 1 : 0.7,
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>{reward.name}</h3>
                                        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#6e6e6e" }}>
                                            {reward.description}
                                        </p>
                                    </div>
                                    {reward.discount && (
                                        <span
                                            style={{
                                                background: "var(--gold)",
                                                color: "white",
                                                padding: "0.25rem 0.75rem",
                                                borderRadius: "6px",
                                                fontSize: "0.875rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            -{reward.discount}%
                                        </span>
                                    )}
                                </div>

                                <div style={{ marginBottom: "1rem" }}>
                                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#6e6e6e" }}>
                                        Cijena: <strong>{reward.pointsCost} bodova</strong>
                                    </p>
                                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: reward.isActive ? "#10b981" : "#ef4444" }}>
                                        {reward.isActive ? "Aktivna" : "Neaktivna"}
                                    </p>
                                </div>

                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        onClick={() => {
                                            setEditingReward(reward);
                                            setRewardForm({
                                                name: reward.name,
                                                description: reward.description,
                                                pointsCost: reward.pointsCost,
                                                discount: reward.discount || 10,
                                            });
                                            setShowRewardModal(true);
                                        }}
                                        className="btn btn-outline btn-sm"
                                        style={{ flex: 1 }}
                                    >
                                        Uredi
                                    </button>
                                    <button
                                        onClick={() => toggleRewardActive(reward.id, reward.isActive)}
                                        className="btn btn-outline btn-sm"
                                        style={{ flex: 1 }}
                                    >
                                        {reward.isActive ? "Deaktiviraj" : "Aktiviraj"}
                                    </button>
                                    <button
                                        onClick={() => deleteReward(reward.id)}
                                        className="btn btn-outline btn-sm"
                                        style={{ color: "#ef4444", borderColor: "#ef4444" }}
                                    >
                                        Obriši
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reward Modal */}
            {showRewardModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                    onClick={() => {
                        setShowRewardModal(false);
                        setEditingReward(null);
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "2rem",
                            width: "90%",
                            maxWidth: "500px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>
                            {editingReward ? "Uredi nagradu" : "Nova nagrada"}
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                                    Naziv *
                                </label>
                                <input
                                    type="text"
                                    value={rewardForm.name}
                                    onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                                    placeholder="Npr. Popust 10%"
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "6px",
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                                    Opis
                                </label>
                                <textarea
                                    value={rewardForm.description}
                                    onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                                    placeholder="Opis nagrade..."
                                    rows={3}
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "6px",
                                        resize: "vertical",
                                    }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                                        Cijena (bodovi) *
                                    </label>
                                    <input
                                        type="number"
                                        value={rewardForm.pointsCost}
                                        onChange={(e) =>
                                            setRewardForm({ ...rewardForm, pointsCost: parseInt(e.target.value) || 0 })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            border: "1px solid #e0e0e0",
                                            borderRadius: "6px",
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                                        Popust (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={rewardForm.discount}
                                        onChange={(e) =>
                                            setRewardForm({ ...rewardForm, discount: parseInt(e.target.value) || 0 })
                                        }
                                        min={0}
                                        max={100}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            border: "1px solid #e0e0e0",
                                            borderRadius: "6px",
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                <button
                                    onClick={() => {
                                        setShowRewardModal(false);
                                        setEditingReward(null);
                                    }}
                                    className="btn btn-outline"
                                    style={{ flex: 1 }}
                                >
                                    Odustani
                                </button>
                                <button onClick={saveReward} className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingReward ? "Ažuriraj" : "Kreiraj"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

