"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                // ✅ Spremi usera i token u context (AuthContext)
                login(data.user, data.token);
                setMessage("✅ Prijava uspješna!");
                setTimeout(() => router.push("/profile"), 1000);
            } else {
                setMessage(`❌ ${data.error || "Greška pri prijavi"}`);
            }
        } catch (error) {
            console.error("Login error:", error);
            setMessage("❌ Greška na serveru");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-porcelain">
            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-md rounded-2xl p-6 w-80"
            >
                <h2 className="text-xl font-bold mb-4 text-center">Prijava</h2>

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border rounded w-full p-2 mb-3"
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Lozinka"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border rounded w-full p-2 mb-3"
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold text-white rounded p-2 hover:bg-amber-600 transition"
                >
                    {loading ? "Prijava..." : "Prijavi se"}
                </button>

                {message && (
                    <p
                        className={`mt-3 text-center text-sm ${
                            message.includes("❌") ? "text-red-500" : "text-green-600"
                        }`}
                    >
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}
