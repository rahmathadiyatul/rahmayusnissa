'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const password = formData.get('password')

    if (password === process.env.DASHBOARD_PASSWORD) {
        const cookieStore = await cookies();
        cookieStore.set('wedding_dashboard_auth', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        })
        redirect('/dashboard')
    }

    // Return an error flag (can't throw an Error easily back to simple client without try/catch or form states)
    // But Next 15 handles redirects implicitly stopping execution here
    return { error: 'Invalid password' }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('wedding_dashboard_auth')
    redirect('/dashboard/login')
}
