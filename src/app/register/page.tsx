"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Registration successful! You can now login.");
      setForm({ name: "", email: "", password: "" });
    } else {
      setMessage(`❌ ${data.error || "Something went wrong"}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-porcelain">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-2xl p-6 w-80"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Register</h2>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="border rounded w-full p-2 mb-3"
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border rounded w-full p-2 mb-3"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border rounded w-full p-2 mb-3"
        />
        <button
          type="submit"
          className="w-full bg-gold text-white rounded p-2 hover:bg-amber-600 transition"
        >
          Register
        </button>
        {message && <p className="mt-3 text-center text-sm">{message}</p>}
      </form>
    </div>
  );
}
