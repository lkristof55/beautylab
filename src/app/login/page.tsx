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
                // Spremi usera i token u context
                login(data.user, data.token);
                setMessage("✅ Prijava uspješna!");

                // VAŽNO: Svi idu na /dashboard - sistem će prepoznati je li admin ili user
                setTimeout(() => router.push("/dashboard"), 1000);
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-porcelain via-blush to-porcelain">
            <form
                onSubmit={handleSubmit}
                className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl p-8 w-96 border border-beige"
            >
                <h2 className="text-3xl font-heading font-bold mb-6 text-center text-graphite">
                    Dobrodošla natrag 💅
                </h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-graphite">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        placeholder="irena@beautylab.hr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border border-beige rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-gold transition"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-graphite">
                        Lozinka
                    </label>
                    <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border border-beige rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-gold transition"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold text-white rounded-lg p-3 font-semibold hover:brightness-95 transition disabled:opacity-60"
                >
                    {loading ? "Prijava..." : "Prijavi se"}
                </button>

                {message && (
                    <p
                        className={`mt-4 text-center text-sm font-medium ${
                            message.includes("❌") ? "text-red-600" : "text-green-600"
                        }`}
                    >
                        {message}
                    </p>
                )}

                <p className="mt-6 text-center text-sm text-gray-600">
                    Nemaš račun?{" "}
                    <a href="/register" className="text-gold hover:underline font-medium">
                        Registriraj se
                    </a>
                </p>
            </form>
        </div>
    );
}