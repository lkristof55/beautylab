import Link from "next/link"

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-porcelain text-graphite">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-beige p-6 space-y-4">
                <h2 className="text-2xl font-heading mb-6">Admin Panel 💅</h2>
                <nav className="flex flex-col space-y-3">
                    <Link href="/admin/dashboard" className="hover:text-pink font-medium">
                        📅 Termini
                    </Link>
                    <Link href="/admin/users" className="hover:text-pink font-medium">
                        👩‍💻 Korisnice
                    </Link>
                    <Link href="/admin/stats" className="hover:text-pink font-medium">
                        📊 Statistika
                    </Link>
                </nav>
            </aside>

            {/* Glavni sadržaj */}
            <main className="flex-1 p-10">{children}</main>
        </div>
    )
}
