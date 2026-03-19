import { logout } from '@/app/actions/auth'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-black text-gray-200 flex flex-col font-sans">
            <header className="border-b border-gray-800 sticky top-0 bg-black z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white tracking-widest">DASHBOARD</h1>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="text-sm px-4 py-2 border border-gray-700 rounded hover:bg-zinc-900 transition-colors"
                        >
                            Logout
                        </button>
                    </form>
                </div>
            </header>
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
                {children}
            </main>
        </div>
    )
}
