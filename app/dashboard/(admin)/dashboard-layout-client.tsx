'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayoutClient({ children, logoutSlot }: { children: React.ReactNode, logoutSlot: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const navItems = [
        { label: 'List Undangan', href: '/dashboard' },
        { label: 'Detail Undangan', href: '/dashboard/detail' },
    ]

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-800 flex flex-col font-sans relative">
            <header className="border-b border-[rgba(212,175,55,0.2)] sticky top-0 bg-white/80 backdrop-blur-md z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="sm:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
                            aria-label="Toggle Menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold font-display text-[var(--accent-gold)] tracking-[0.2em] uppercase shrink-0">DASHBOARD</h1>
                    </div>
                    <div className="relative z-50 shrink-0">
                        {logoutSlot}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto w-full flex flex-1 py-6 sm:py-8 px-4 gap-6">
                {/* Mobile Menu Overlay */}
                {isOpen && (
                    <div
                        className="fixed inset-0 top-16 bg-black/20 z-40 sm:hidden transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed sm:sticky sm:top-24 left-0 h-[calc(100vh-4rem)] sm:h-fit
                    w-64 sm:w-64 shrink-0 bg-[#f8f9fa] sm:bg-transparent z-40 
                    border-r sm:border-none border-gray-200 p-4 sm:p-0
                    transition-transform duration-200 ease-in-out
                    ${isOpen ? 'translate-x-0 bg-white shadow-xl sm:shadow-none sm:bg-transparent' : '-translate-x-full sm:translate-x-0'}
                `}>
                    <nav className="flex flex-col gap-2">
                        {navItems.map(item => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`px-5 py-3.5 rounded-2xl font-bold tracking-widest text-[13px] uppercase whitespace-nowrap transition-all ${isActive
                                        ? 'bg-[rgba(212,175,55,0.1)] text-[var(--accent-gold-dark)] border border-[rgba(212,175,55,0.3)] shadow-[0_4px_20px_rgba(212,175,55,0.05)]'
                                        : 'text-gray-500 hover:bg-[rgba(0,0,0,0.02)] sm:hover:bg-white hover:text-gray-900 border border-transparent hover:shadow-sm'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    )
}