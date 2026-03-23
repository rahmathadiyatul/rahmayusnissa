'use client'

import { useState, useMemo } from 'react'
import {
    InviteeRow,
    toggleInviteeSent,
    addInvitee,
    editInvitee,
    addInviteeBulk,
    deleteInvitee
} from './actions'

export default function DashboardClient({ initialInvitees }: { initialInvitees: InviteeRow[] }) {
    const [invitees, setInvitees] = useState(initialInvitees)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'unsent'>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingInvitee, setEditingInvitee] = useState<InviteeRow | null>(null)

    const filteredInvitees = useMemo(() => {
        return invitees.filter(inv => {
            const matchesSearch = inv.full_name.toLowerCase().includes(search.toLowerCase()) ||
                (inv.display_name && inv.display_name.toLowerCase().includes(search.toLowerCase()))

            const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'sent' ? inv.is_sent : !inv.is_sent)

            return matchesSearch && matchesStatus
        })
    }, [invitees, search, statusFilter])

    const handleToggleSent = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setInvitees(prev => prev.map(inv => inv.id === id ? { ...inv, is_sent: !currentStatus } : inv))
        await toggleInviteeSent(id, currentStatus)
    }

    const handleOpenModal = (invitee?: InviteeRow) => {
        if (invitee) setEditingInvitee(invitee)
        else setEditingInvitee(null)
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        if (editingInvitee) {
            await editInvitee(editingInvitee.id, formData)
            // For a quick fix, let's reload the page to get fresh data or we could just update the local state.
            // Easiest is location.reload() or let Next.js revalidate path take care of it via router.refresh, but we are using state.
            window.location.reload()
        } else {
            await addInvitee(formData)
            window.location.reload()
        }
        setIsModalOpen(false)
    }

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            // Optimistic update
            setInvitees(prev => prev.filter(inv => inv.id !== id))
            await deleteInvitee(id)
        }
    }

    const handleImportContacts = async () => {
        if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
                const props = ['name', 'tel'];
                const opts = { multiple: true };
                // @ts-ignore - Contact Picker API
                const contacts = await navigator.contacts.select(props, opts);

                if (contacts.length > 0) {
                    const formattedContacts = contacts.map((c: any) => ({
                        full_name: c.name?.[0] || 'Unknown',
                        display_name: c.name?.[0] || 'Unknown',
                        phone: c.tel?.[0] ? c.tel[0].replace(/\D/g, '') : null, // keep only digits
                        max_pax: 2
                    }))

                    await addInviteeBulk(formattedContacts)
                    window.location.reload()
                }
            } catch (ex) {
                console.error('Error importing contacts', ex);
                alert('Failed to import contacts or permission denied.');
            }
        } else {
            alert('Contact Picker API is not supported on this browser.');
        }
    }

    const getWaLink = (invitee: InviteeRow) => {
        if (!invitee.phone) return '#'

        // Normalize phone number: remove all non-numeric characters (spaces, +, -, etc)
        let phone = invitee.phone.replace(/\D/g, '')
        // Convert leading 0 to 62 (Indonesia country code)
        if (phone.startsWith('0')) {
            phone = '62' + phone.slice(1)
        }

        const isSent = invitee.is_sent
        let icon = "wa"
        const text = encodeURIComponent(`
Assalamu'alaikum Warahmatullahi Wabarakatuh,

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i ${invitee.display_name || invitee.full_name} untuk menghadiri acara pernikahan kami:

*Rahma Yus Nissa, S.Pt (Ica)*
Putri ke-4 dari Bapak (alm) H. Yusmin RB & Ibu Betmawati
&
*Afdal Rahmadhani (Afdal)*
Putra ke-4 dari Bapak Eman & Ibu Nurhayani

Yang Insya Allah akan dilaksanakan pada:

*AKAD NIKAH & RESEPSI*
Hari, Tanggal: Sabtu, 4 April 2026
Waktu: 08.00 WIB s/d Selesai
Alamat: Jln. Zahlul St. Kebesaran No. 43 RT 002 RW 005 Kel. Simpang Rumbio, Kec. Lubuk Sikarah, Kota Solok.

Berikut tautan undangan digital kami untuk informasi lebih lengkap:
https://ica-afdal.com/wedding?invitee=${invitee.id}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Terima kasih banyak atas perhatian dan doa restunya.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.`)

        // Force standard WhatsApp on Android (avoids opening WhatsApp Business)
        if (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)) {
            return `intent://send?phone=${phone}&text=${text}#Intent;package=com.whatsapp;scheme=whatsapp;end`
        }

        return `https://wa.me/${phone}?text=${text}`
    }

    const copyIgMessage = async (invitee: InviteeRow) => {
        const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh / Salam Sejahtera,

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i ${invitee.display_name || invitee.full_name} untuk menghadiri acara pernikahan kami:

👰 Rahma Yus Nissa, S.Pt (Ica)
Putri ke-4 dari Bapak (alm) H. Yusmin RB & Ibu Betmawati
&
🤵 Afdal Rahmadhani (Afdal)
Putra ke-4 dari Bapak Eman & Ibu Nurhayani

Yang Insya Allah akan dilaksanakan pada:

💍 AKAD NIKAH & RESEPSI
Hari, Tanggal: Sabtu, 4 April 2026
Waktu: 08.00 WIB s/d Selesai
Alamat: Jln. Zahlul St. Kebesaran No. 43 RT 002 RW 005 Kel. Simpang Rumbio, Kec. Lubuk Sikarah, Kota Solok.

Berikut tautan undangan digital kami untuk informasi lebih lengkap:
👉 https://ica-afdal.com/wedding?invitee=${invitee.id}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Terima kasih banyak atas perhatian dan doa restunya.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.`

        await navigator.clipboard.writeText(text)
        alert('Message copied to clipboard! Opening Instagram...')
        if (invitee.instagram) {
            const igHandle = invitee.instagram.replace('@', '')
            window.open(`https://instagram.com/${igHandle}`, '_blank')
        } else {
            window.open('https://instagram.com', '_blank')
        }
    }

    return (
        <div className="space-y-8">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center sm:sticky sm:top-16 bg-[#f8f9fa] py-4 z-10">
                <div className="relative w-full sm:max-w-xs flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 shadow-sm rounded-full pl-11 pr-4 py-3 text-base text-gray-800 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as 'all' | 'sent' | 'unsent')}
                        className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 focus:outline-none">
                        <option value="all">Semua</option>
                        <option value="sent">Terkirim</option>
                        <option value="unsent">Belum</option>
                    </select>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex-1 sm:flex-none font-display text-xs tracking-[0.2em] font-bold bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.4)] text-[var(--accent-gold-dark)] px-6 py-3 rounded-full hover:bg-[rgba(212,175,55,0.2)] transition-colors shadow-sm uppercase flex items-center justify-center gap-1.5"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        TAMBAH
                    </button>
                    {('contacts' in navigator && 'ContactsManager' in window) && (
                        <button
                            onClick={handleImportContacts}
                            className="flex-1 sm:flex-none font-display text-xs tracking-[0.2em] font-bold bg-white border border-gray-300 text-gray-600 px-5 py-3 rounded-full hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm uppercase flex items-center justify-center gap-1.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            IMPORT KONTAK
                        </button>
                    )}
                </div>
            </div>

            {/* List / Table */}
            <div className="grid gap-4 sm:hidden">
                {/* Mobile Cards */}
                {filteredInvitees.map(inv => (
                    <div key={inv.id} className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 rounded-2xl p-6 space-y-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-900 text-xl">{inv.full_name}</h3>
                                {inv.display_name && inv.display_name !== inv.full_name && (
                                    <p className="text-base text-gray-500">({inv.display_name})</p>
                                )}
                                <p className="text-sm text-gray-400 mt-1 uppercase tracking-wider font-semibold">Pax: {inv.max_pax}</p>
                            </div>
                            <button
                                onClick={() => handleToggleSent(inv.id, inv.is_sent)}
                                className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-bold border transition-colors ${inv.is_sent ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                                    }`}
                            >
                                {inv.is_sent ? 'Terkirim' : 'Belum'}
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs font-bold tracking-wider uppercase">
                            <button onClick={() => handleOpenModal(inv)} className="bg-gray-50 border border-gray-200 hover:bg-gray-100 px-4 py-3 rounded-lg text-gray-600 flex-1 text-center transition-colors">
                                Edit
                            </button>
                            {inv.phone && (
                                <a href={getWaLink(inv)} target="_blank" rel="noreferrer" className="bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 px-4 py-3 rounded-lg text-[#25D366] flex-1 text-center transition-colors flex justify-center items-center gap-1.5">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                                    WA
                                </a>
                            )}
                            {inv.instagram && (
                                <button onClick={() => copyIgMessage(inv)} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:from-purple-100 hover:to-pink-100 px-4 py-3 rounded-lg text-purple-700 flex-1 text-center transition-colors flex justify-center items-center gap-1.5">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                    IG
                                </button>
                            )}
                            <button onClick={() => handleDelete(inv.id, inv.full_name)} className="bg-red-50 border border-red-100 hover:bg-red-100 px-4 py-3 rounded-lg text-red-600 flex-none text-center transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                ))}
                {filteredInvitees.length === 0 && (
                    <div className="text-center text-gray-500 text-lg py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">Tidak ada data undangan.</div>
                )}
            </div>

            <div className="hidden sm:block overflow-x-auto bg-white shadow-sm border border-gray-100 rounded-2xl">
                {/* Desktop Table */}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 text-sm text-gray-500 uppercase tracking-widest">
                            <th className="py-5 px-6 font-bold">Name</th>
                            <th className="py-5 px-6 font-bold">Contact</th>
                            <th className="py-5 px-6 font-bold">Status</th>
                            <th className="py-5 px-6 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredInvitees.map(inv => (
                            <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-5 px-6">
                                    <div className="text-gray-900 font-bold text-lg">{inv.full_name}</div>
                                    <div className="text-sm text-gray-400 mt-1 uppercase tracking-wider font-semibold">Pax: {inv.max_pax}</div>
                                </td>
                                <td className="py-5 px-6 flex flex-col gap-2 justify-center h-full">
                                    {inv.phone && <span className="text-base text-gray-600 flex items-center gap-2"><svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg> {inv.phone}</span>}
                                    {inv.instagram && <span className="text-base text-gray-600 flex items-center gap-2"><svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> {inv.instagram}</span>}
                                    {!inv.phone && !inv.instagram && <span className="text-sm text-gray-400">-</span>}
                                </td>
                                <td className="py-5 px-6">
                                    <button
                                        onClick={() => handleToggleSent(inv.id, inv.is_sent)}
                                        className={`px-5 py-2 rounded-full text-xs uppercase tracking-wider font-bold border transition-colors ${inv.is_sent ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                                            }`}
                                    >
                                        {inv.is_sent ? 'Terkirim' : 'Belum'}
                                    </button>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex gap-2 justify-end text-[11px] font-bold tracking-wider uppercase">
                                        <button onClick={() => handleOpenModal(inv)} className="bg-gray-50 border border-gray-200 hover:bg-gray-100 px-3 py-2 rounded text-gray-600 transition-colors">
                                            Edit
                                        </button>
                                        {inv.phone && (
                                            <a href={getWaLink(inv)} target="_blank" rel="noreferrer" className="bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 px-3 py-2 rounded text-[#25D366] transition-colors flex items-center gap-1">
                                                WA
                                            </a>
                                        )}
                                        {inv.instagram && (
                                            <button onClick={() => copyIgMessage(inv)} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:from-purple-100 hover:to-pink-100 px-3 py-2 rounded text-purple-700 transition-colors flex items-center gap-1">
                                                IG
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(inv.id, inv.full_name)} className="bg-red-50 border border-red-100 hover:bg-red-100 px-3 py-2 rounded text-red-600 transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredInvitees.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center text-gray-500 py-12">Tidak ada data undangan.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
                    <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(212,175,55,0.05)] rounded-bl-full pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-6 relative">
                            <h2 className="text-xl font-bold font-display tracking-wider text-[var(--accent-gold)] uppercase">{editingInvitee ? 'Edit Invitee' : 'Add Invitee'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 relative">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Nama Lengkap *</label>
                                <input required defaultValue={editingInvitee?.full_name || ''} name="full_name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Nama Panggilan {editingInvitee?.display_name ? '' : '(Opsional)'}</label>
                                <input defaultValue={editingInvitee?.display_name || ''} name="display_name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all" />
                                <p className="text-xs text-gray-400 mt-2">Akan digunakan pada sapaan awal undangan.</p>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Nomor WA / HP</label>
                                <input defaultValue={editingInvitee?.phone || ''} name="phone" placeholder="Cth: 08123456789" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Username Instagram</label>
                                <input defaultValue={editingInvitee?.instagram || ''} name="instagram" placeholder="Cth: @username" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Maksimal Pax *</label>
                                <input required type="number" min="1" defaultValue={editingInvitee?.max_pax || 2} name="max_pax" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all" />
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-sm tracking-wider font-bold text-gray-500 hover:text-gray-800 uppercase transition-colors">Batal</button>
                                <button type="submit" className="font-display bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.4)] text-[var(--accent-gold-dark)] px-6 py-3 rounded-full text-sm tracking-[0.15em] font-bold uppercase hover:bg-[rgba(212,175,55,0.2)] transition-colors">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
