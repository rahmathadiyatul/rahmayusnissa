import type { InviteeRow } from '@/app/dashboard/(admin)/actions'

export type DashboardDetailContext = {
    totals: {
        totalInvitees: number
        totalSent: number
        totalUnsent: number
        totalSentPax: number
        totalPax: number
        sentRatePercent: number
    }
    chartData: Array<{
        name: 'Undangan' | 'Pax (Tamu)'
        total: number
        terkirim: number
        belum: number
    }>
}

export function buildDashboardDetailContext(invitees: InviteeRow[]): DashboardDetailContext {
    const totalInvitees = invitees.length
    const totalSent = invitees.filter((invitee) => invitee.is_sent).length
    const totalUnsent = totalInvitees - totalSent
    const totalSentPax = invitees
        .filter((invitee) => invitee.is_sent)
        .reduce((sum, invitee) => sum + (invitee.max_pax || 0), 0)
    const totalPax = invitees.reduce((sum, invitee) => sum + (invitee.max_pax || 0), 0)
    const sentRatePercent = totalInvitees > 0 ? Math.round((totalSent / totalInvitees) * 100) : 0

    return {
        totals: {
            totalInvitees,
            totalSent,
            totalUnsent,
            totalSentPax,
            totalPax,
            sentRatePercent,
        },
        chartData: [
            {
                name: 'Undangan',
                total: totalInvitees,
                terkirim: totalSent,
                belum: totalUnsent,
            },
            {
                name: 'Pax (Tamu)',
                total: totalPax,
                terkirim: totalSentPax,
                belum: totalPax - totalSentPax,
            },
        ],
    }
}