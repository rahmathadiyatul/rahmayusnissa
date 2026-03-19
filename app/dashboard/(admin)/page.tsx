import { getInvitees } from './actions'
import DashboardClient from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const invitees = await getInvitees()

    return (
        <DashboardClient initialInvitees={invitees} />
    )
}
