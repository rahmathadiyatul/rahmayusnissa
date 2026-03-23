import { logout } from '@/app/actions/auth'
import ChatAssistant from '@/app/components/ChatAssistant'
import LogoutButton from './logout-button'
import DashboardLayoutClient from './dashboard-layout-client'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <DashboardLayoutClient
                logoutSlot={
                    <form action={logout}>
                        <LogoutButton />
                    </form>
                }
            >
                {children}
            </DashboardLayoutClient>
            <ChatAssistant />
        </>
    )
}
