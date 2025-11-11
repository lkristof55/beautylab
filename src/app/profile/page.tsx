"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Appointment = {
  id: string;
  service: string;
  date: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // 1️⃣ Dohvati korisnika
        const profileRes = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileRes.ok) throw new Error("Greška kod profila");
        const profileData = await profileRes.json();
        setUser(profileData.user);

        // 2️⃣ Dohvati termine
        const apptRes = await fetch("/api/appointments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!apptRes.ok) throw new Error("Greška kod termina");
        const apptData = await apptRes.json();
        setAppointments(apptData.appointments || []);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleCancel = async (appointmentId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const confirmCancel = window.confirm("Jeste li sigurni da želite otkazati termin?");
    if (!confirmCancel) return;

    const res = await fetch("/api/appointments", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ appointmentId }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      // Makni otkazani termin s ekrana
      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    } else {
      alert(data.error);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Učitavanje profila...</p>
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-porcelain flex flex-col items-center justify-start py-10 px-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">
        {/* Info o korisniku */}
        <h1 className="text-3xl font-bold text-center mb-2">
          Dobrodošla, <span className="text-gold">{user.name}</span> 💅
        </h1>
        <p className="text-center text-gray-700 mb-2">{user.email}</p>
        <p className="text-center text-sm text-gray-500 mb-6">
          Član od: {new Date(user.createdAt).toLocaleDateString("hr-HR")}
        </p>

        <button
          onClick={handleLogout}
          className="block mx-auto bg-gold text-white px-6 py-2 rounded hover:bg-yellow-600 transition mb-8"
        >
          Odjavi se
        </button>

        {/* Lista termina */}
        <h2 className="text-2xl font-semibold mb-3 text-gold text-center">
          📅 Moji termini
        </h2>

        {appointments.length === 0 ? (
          <p className="text-center text-gray-500">
            Nemaš još rezerviranih termina.
          </p>
        ) : (
          <table className="w-full border border-gray-200 rounded-lg text-left">
            <thead className="bg-gold text-white">
              <tr>
                <th className="p-3">Usluga</th>
                <th className="p-3">Datum</th>
                <th className="p-3 text-center">Akcija</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const isCancelable =
                  new Date(a.date).getTime() - Date.now() > 24 * 60 * 60 * 1000; // više od 24h

                return (
                  <tr key={a.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{a.service}</td>
                    <td className="p-3">
                      {new Date(a.date).toLocaleString("hr-HR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-3 text-center">
                      {isCancelable ? (
                        <button
                          onClick={() => handleCancel(a.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Otkaži
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm italic">
                          Nije moguće otkazati
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
