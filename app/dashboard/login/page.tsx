'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setError(null)
        const res = await login(formData)
        if (res?.error) {
            setError(res.error)
            setIsPending(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-gray-200 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm border border-gray-800 rounded-lg p-8 bg-zinc-950 shadow-2xl">
                <h1 className="text-2xl text-center text-white mb-8">Dashboard Login</h1>
                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm mb-2 text-gray-400">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="w-full bg-zinc-900 border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-gray-500 transition-colors"
                            placeholder="Enter passcode"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-white text-black py-3 rounded font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {isPending ? 'Authenticating...' : 'Enter Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    )
}
