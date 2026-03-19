import { logout } from '@/app/actions/auth'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-800 flex flex-col font-sans">
            <header className="border-b border-[rgba(212,175,55,0.2)] sticky top-0 bg-white/80 backdrop-blur-md z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold font-display text-[var(--accent-gold)] tracking-[0.2em] uppercase">DASHBOARD</h1>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="text-sm px-5 py-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors tracking-wide"
                        >
                            Logout
                        </button>
                    </form>
                </div>
            </header>
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
                {children}
            </main>
        </div>
    )
}
