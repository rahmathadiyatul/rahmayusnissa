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
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingInvitee, setEditingInvitee] = useState<InviteeRow | null>(null)

    const filteredInvitees = useMemo(() => {
        return invitees.filter(inv =>
            inv.full_name.toLowerCase().includes(search.toLowerCase()) ||
            (inv.display_name && inv.display_name.toLowerCase().includes(search.toLowerCase()))
        )
    }, [invitees, search])

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
        const phone = invitee.phone.startsWith('0') ? '62' + invitee.phone.slice(1) : invitee.phone
        const isSent = invitee.is_sent
        let icon = "wa"
        const text = encodeURIComponent(`Assalamu'alaikum Warahmatullahi Wabarakatuh / Salam Sejahtera,

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i ${invitee.display_name || invitee.full_name} untuk menghadiri acara pernikahan kami:

Assalamu'alaikum Warahmatullahi Wabarakatuh,

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i [Nama Invitee] untuk menghadiri acara pernikahan kami:

*Rahma Yus Nissa, S.Pt (Nissa)*
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

Mohon maaf karena keterbatasan, undangan ini hanya dibagikan melalui pesan digital.

Terima kasih banyak atas perhatian dan doa restunya.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.`)

        return `https://wa.me/${phone}?text=${text}`
    }

    const copyIgMessage = async (invitee: InviteeRow) => {
        const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh / Salam Sejahtera,

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i ${invitee.display_name || invitee.full_name} untuk menghadiri acara pernikahan kami:

👰 Rahma Yus Nissa, S.Pt (Nissa)
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
        <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center sm:sticky sm:top-16 bg-black py-4 z-10">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full sm:max-w-xs bg-zinc-900 border border-gray-800 rounded px-4 py-2 text-white focus:outline-none focus:border-gray-500"
                />
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex-1 sm:flex-none bg-white text-black px-4 py-2 rounded font-medium hover:bg-gray-200 transition-colors"
                    >
                        + Add
                    </button>
                    {('contacts' in navigator && 'ContactsManager' in window) && (
                        <button
                            onClick={handleImportContacts}
                            className="flex-1 sm:flex-none border border-gray-700 text-white px-4 py-2 rounded font-medium hover:bg-zinc-800 transition-colors"
                        >
                            Import Contacts
                        </button>
                    )}
                </div>
            </div>

            {/* List / Table */}
            <div className="grid gap-4 sm:hidden">
                {/* Mobile Cards */}
                {filteredInvitees.map(inv => (
                    <div key={inv.id} className="bg-zinc-900 border border-gray-800 rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-white text-lg">{inv.full_name}</h3>
                                {inv.display_name && inv.display_name !== inv.full_name && (
                                    <p className="text-sm text-gray-400">({inv.display_name})</p>
                                )}
                                <p className="text-sm text-gray-400 mt-1">Pax: {inv.max_pax}</p>
                            </div>
                            <button
                                onClick={() => handleToggleSent(inv.id, inv.is_sent)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${inv.is_sent ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                                    }`}
                            >
                                {inv.is_sent ? 'Sent' : 'Not Sent'}
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                            <button onClick={() => handleOpenModal(inv)} className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded text-white flex-1 text-center">
                                Edit
                            </button>
                            {inv.phone && (
                                <a href={getWaLink(inv)} target="_blank" rel="noreferrer" className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded text-white flex-1 text-center">
                                    WA
                                </a>
                            )}
                            {inv.instagram && (
                                <button onClick={() => copyIgMessage(inv)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-3 py-2 rounded text-white flex-1 text-center">
                                    IG
                                </button>
                            )}
                            <button onClick={() => handleDelete(inv.id, inv.full_name)} className="bg-red-900/80 hover:bg-red-800 px-3 py-2 rounded text-red-100 flex-1 text-center">
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {filteredInvitees.length === 0 && (
                    <div className="text-center text-gray-500 py-8">No invitees found.</div>
                )}
            </div>

            <div className="hidden sm:block overflow-x-auto">
                {/* Desktop Table */}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-800 text-sm text-gray-400 uppercase tracking-wider">
                            <th className="py-4 font-semibold">Name</th>
                            <th className="py-4 font-semibold">Phone / IG</th>
                            <th className="py-4 font-semibold">Status</th>
                            <th className="py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredInvitees.map(inv => (
                            <tr key={inv.id} className="hover:bg-zinc-900/50 transition-colors">
                                <td className="py-4">
                                    <div className="text-white font-medium">{inv.full_name}</div>
                                    <div className="text-xs text-gray-500">Pax: {inv.max_pax}</div>
                                </td>
                                <td className="py-4 flex flex-col gap-1">
                                    {inv.phone && <span className="text-sm text-gray-300">📞 {inv.phone}</span>}
                                    {inv.instagram && <span className="text-sm text-gray-300">📸 {inv.instagram}</span>}
                                    {!inv.phone && !inv.instagram && <span className="text-xs text-gray-600">-</span>}
                                </td>
                                <td className="py-4">
                                    <button
                                        onClick={() => handleToggleSent(inv.id, inv.is_sent)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${inv.is_sent ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
                                            }`}
                                    >
                                        {inv.is_sent ? 'Sent' : 'Not Sent'}
                                    </button>
                                </td>
                                <td className="py-4">
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => handleOpenModal(inv)} className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-white text-xs">
                                            Edit
                                        </button>
                                        {inv.phone && (
                                            <a href={getWaLink(inv)} target="_blank" rel="noreferrer" className="bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded text-white text-xs text-center">
                                                WA
                                            </a>
                                        )}
                                        {inv.instagram && (
                                            <button onClick={() => copyIgMessage(inv)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-3 py-1.5 rounded text-white text-xs">
                                                IG
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(inv.id, inv.full_name)} className="bg-red-900/80 hover:bg-red-800 px-3 py-1.5 rounded text-red-100 text-xs text-center">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredInvitees.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center text-gray-500 py-8">No invitees found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-zinc-950 border border-gray-800 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{editingInvitee ? 'Edit Invitee' : 'Add Invitee'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1 text-gray-400">Full Name *</label>
                                <input required defaultValue={editingInvitee?.full_name || ''} name="full_name" className="w-full bg-zinc-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-gray-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-400">Display Name {editingInvitee?.display_name ? '' : '(Optional)'}</label>
                                <input defaultValue={editingInvitee?.display_name || ''} name="display_name" className="w-full bg-zinc-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-gray-500 outline-none" />
                                <p className="text-xs text-gray-600 mt-1">Shorter name used in the invitation greeting</p>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-400">Phone (WhatsApp)</label>
                                <input defaultValue={editingInvitee?.phone || ''} name="phone" placeholder="e.g. 08123456789" className="w-full bg-zinc-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-gray-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-400">Instagram Handle</label>
                                <input defaultValue={editingInvitee?.instagram || ''} name="instagram" placeholder="e.g. @username" className="w-full bg-zinc-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-gray-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-400">Max Pax *</label>
                                <input required type="number" min="1" defaultValue={editingInvitee?.max_pax || 2} name="max_pax" className="w-full bg-zinc-900 border border-gray-800 rounded px-3 py-2 text-white focus:border-gray-500 outline-none" />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                                <button type="submit" className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-gray-200">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
