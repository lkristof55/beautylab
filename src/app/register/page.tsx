"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        const data = await res.json();
        if (res.ok) {
            setMessage("✅ Registracija uspješna! Preusmjeravanje na login...");
            setForm({ name: "", email: "", password: "" });
            setTimeout(() => router.push("/login"), 2000);
        } else {
            setMessage(`❌ ${data.error || "Greška pri registraciji"}`);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-porcelain via-blush to-porcelain">
            <form
                onSubmit={handleSubmit}
                className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl p-8 w-96 border border-beige"
            >
                <h2 className="text-3xl font-heading font-bold mb-6 text-center text-graphite">
                    Dobrodošla u Beauty Lab 💅
                </h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-graphite">
                        Ime i prezime
                    </label>
                    <input
                        name="name"
                        placeholder="Irena Horvat"
                        value={form.name}
                        onChange={handleChange}
                        className="border border-beige rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-gold transition"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-graphite">
                        Email
                    </label>
                    <input
                        name="email"
                        type="email"
                        placeholder="irena@beautylab.hr"
                        value={form.email}
                        onChange={handleChange}
                        className="border border-beige rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-gold transition"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-graphite">
                        Lozinka
                    </label>
                    <input
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        className="border border-beige rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-gold transition"
                        required
                        minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimalno 6 znakova</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold text-white rounded-lg p-3 font-semibold hover:brightness-95 transition disabled:opacity-60"
                >
                    {loading ? "Registracija..." : "Registriraj se"}
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
                    Već imaš račun?{" "}
                    <a href="/login" className="text-gold hover:underline font-medium">
                        Prijavi se
                    </a>
                </p>
            </form>
        </div>
    );
}