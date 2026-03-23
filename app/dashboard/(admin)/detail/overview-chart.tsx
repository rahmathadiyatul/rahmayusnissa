'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { InviteeRow } from '../actions'
import { useMemo } from 'react'

export default function OverviewChart({ invitees }: { invitees: InviteeRow[] }) {
    const data = useMemo(() => {
        const total = invitees.length;
        const sent = invitees.filter(i => i.is_sent).length;
        const unsent = total - sent;

        const maxPax = invitees.reduce((sum, i) => sum + (i.max_pax || 0), 0);
        const sentPax = invitees.filter(i => i.is_sent).reduce((sum, i) => sum + (i.max_pax || 0), 0);

        return [
            {
                name: 'Undangan',
                total: total,
                terkirim: sent,
                belum: unsent,
            },
            {
                name: 'Pax (Tamu)',
                total: maxPax,
                terkirim: sentPax,
                belum: maxPax - sentPax,
            }
        ];
    }, [invitees])

    return (
        <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: -20,
                        bottom: 5,
                    }}
                    barSize={40}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fontWeight: 600, fill: '#6b7280' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontSize: '13px', fontWeight: 600 }}
                    />

                    {/* Using simple side-by-side comparison */}
                    <Bar name="Terkirim" dataKey="terkirim" fill="#4ade80" radius={[4, 4, 0, 0]} />
                    <Bar name="Belum Terkirim" dataKey="belum" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
