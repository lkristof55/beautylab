"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function BookPage() {
  const [service, setService] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("⚠️ Moraš biti prijavljen da bi rezervirao termin.");
      return;
    }

    if (!service || !date) {
      setMessage("Molimo odaberi uslugu i datum.");
      return;
    }

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        service,
        date: date.toISOString(),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Termin uspješno rezerviran!");
      setService("");
      setDate(null);
    } else {
      setMessage(`❌ Greška: ${data.error || "Pokušaj ponovno."}`);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-porcelain">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-semibold text-center text-graphite mb-6">
          Rezerviraj termin 💅
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="font-medium">Usluga</label>
          <select
            className="border border-gray-300 rounded-lg p-2"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">-- Odaberi uslugu --</option>
            <option value="Manikura">Manikura</option>
            <option value="Pedikura">Pedikura</option>
            <option value="Depilacija">Depilacija</option>
            <option value="Masaža">Masaža</option>
          </select>

          <label className="font-medium mt-2">Datum</label>
          <DatePicker
            selected={date}
            onChange={(d) => setDate(d)}
            showTimeSelect
            dateFormat="Pp"
            placeholderText="Odaberi datum i vrijeme"
            className="border border-gray-300 rounded-lg p-2 w-full"
          />

          <button
            type="submit"
            className="mt-4 bg-gold text-white py-2 rounded-lg hover:bg-yellow-500 transition"
          >
            Rezerviraj
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center font-medium ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
