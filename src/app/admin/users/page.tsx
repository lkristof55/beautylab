'use client'
import { useEffect, useState } from 'react'

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])

    useEffect(() => {
        const token = localStorage.getItem('token')
        fetch('/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setUsers(data))
    }, [])

    return (
        <div>
            <h1 className="text-3xl font-heading mb-6">👩‍💻 Korisnice</h1>
            <table className="w-full border-collapse border border-beige text-left">
                <thead className="bg-pink/20">
                <tr>
                    <th className="border border-beige p-2">Ime</th>
                    <th className="border border-beige p-2">Email</th>
                    <th className="border border-beige p-2">Datum registracije</th>
                </tr>
                </thead>
                <tbody>
                {users.map((u) => (
                    <tr key={u.id}>
                        <td className="border border-beige p-2">{u.name}</td>
                        <td className="border border-beige p-2">{u.email}</td>
                        <td className="border border-beige p-2">
                            {new Date(u.createdAt).toLocaleDateString('hr-HR')}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
