import { getInvitees } from '../actions'
import OverviewChart from './overview-chart'
import { buildDashboardDetailContext } from '@/lib/dashboard/detail-context'

export const dynamic = 'force-dynamic'

export default async function DetailPage() {
    const invitees = await getInvitees()
    const detailContext = buildDashboardDetailContext(invitees)

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold font-display tracking-widest text-gray-900 uppercase">Detail Undangan</h2>
                <p className="text-gray-500 mt-2 text-sm">Ringkasan dan statistik data undangan The Wedding of Ica & Afdal</p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <h3 className="text-sm font-bold tracking-[0.1em] uppercase text-gray-400 mb-6">Grafik Pengiriman & Pax</h3>
                <OverviewChart invitees={invitees} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Undangan"
                    value={detailContext.totals.totalInvitees}
                    subtitle="Semua kontak"
                    color="blue"
                />
                <StatCard
                    title="Terkirim"
                    value={detailContext.totals.totalSent}
                    subtitle={`${detailContext.totals.totalUnsent} belum terkirim`}
                    color="green"
                />
                <StatCard
                    title="Pax Terkirim"
                    value={detailContext.totals.totalSentPax}
                    subtitle="Dari undangan terkirim"
                    color="purple"
                />
                <StatCard
                    title="Total Semua Pax"
                    value={detailContext.totals.totalPax}
                    subtitle="Batas maks tamu"
                    color="gold"
                />
            </div>

            {/* Optional detailed metrics */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <h3 className="text-sm font-bold tracking-[0.1em] uppercase text-gray-400">Status Pengiriman</h3>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex">
                    <div
                        className="bg-green-400 h-full transition-all duration-500"
                        style={{ width: `${detailContext.totals.sentRatePercent}%` }}
                    />
                </div>
                <div className="flex justify-between text-sm font-medium">
                    <span className="text-green-600">{detailContext.totals.totalSent} Terkirim ({detailContext.totals.sentRatePercent}%)</span>
                    <span className="text-gray-500">{detailContext.totals.totalUnsent} Belum</span>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, subtitle, color }: { title: string, value: number | string, subtitle: string, color: 'blue' | 'green' | 'purple' | 'gold' | 'orange' }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        green: 'bg-green-50 text-green-700 border-green-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-100',
        gold: 'bg-[rgba(212,175,55,0.1)] text-[var(--accent-gold-dark)] border-[rgba(212,175,55,0.2)]',
        orange: 'bg-orange-50 text-orange-700 border-orange-100'
    }

    return (
        <div className={`p-6 rounded-3xl border shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px] ${colors[color]}`}>
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-80">
                {title}
            </div>
            <div>
                <div className="text-4xl font-display font-bold mt-3">
                    {value}
                </div>
                <div className="text-xs font-medium opacity-80 mt-1.5">
                    {subtitle}
                </div>
            </div>
        </div>
    )
}