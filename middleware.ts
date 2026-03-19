import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const authCookie = request.cookies.get('wedding_dashboard_auth')
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
    const isLoginPage = request.nextUrl.pathname === '/dashboard/login'

    // If trying to access dashboard (except login page) without auth cookie
    if (isDashboardPage && !isLoginPage && authCookie?.value !== 'authenticated') {
        const loginUrl = new URL('/dashboard/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // If trying to access login page while already authenticated
    if (isLoginPage && authCookie?.value === 'authenticated') {
        const dashboardUrl = new URL('/dashboard', request.url)
        return NextResponse.redirect(dashboardUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/dashboard/:path*',
}
