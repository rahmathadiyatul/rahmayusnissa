'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import SubmitButton from './submit-button'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        const res = await login(formData)
        if (res?.error) {
            setError(res.error)
        }
    }

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-800 flex flex-col justify-center items-center p-4 font-sans">
            <div className="w-full max-w-sm rounded-2xl p-8 bg-white shadow-[0_8px_30px_rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(212,175,55,0.05)] rounded-bl-full"></div>
                <div className="relative z-10">
                    <h1 className="text-2xl text-center font-display tracking-widest text-[var(--accent-gold)] mb-8 uppercase font-bold">Dashboard</h1>
                    <form action={handleSubmit} className="space-y-6 flex flex-col">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all"
                                placeholder="Enter passcode"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}
                        <SubmitButton />
                    </form>
                </div>
            </div>
        </div>
    )
}
