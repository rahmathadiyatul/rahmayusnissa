'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type InviteeRow = {
    id: string
    full_name: string
    display_name: string | null
    phone: string | null
    instagram: string | null
    max_pax: number
    is_active: boolean
    is_sent: boolean
    created_at: string | null
}

export async function getInvitees() {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
        .from('invitees')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching invitees:', error)
        return []
    }

    return data as InviteeRow[]
}

export async function toggleInviteeSent(id: string, currentStatus: boolean) {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
        .from('invitees')
        .update({ is_sent: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Error toggling invitee status:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function addInvitee(formData: FormData) {
    const supabase = createSupabaseServerClient()

    const full_name = formData.get('full_name') as string
    const display_name = formData.get('display_name') as string || null
    const phone = formData.get('phone') as string || null
    const instagram = formData.get('instagram') as string || null
    const max_pax = parseInt(formData.get('max_pax') as string) || 2

    const id = crypto.randomUUID()

    const { error } = await supabase
        .from('invitees')
        .insert({
            id,
            full_name,
            display_name,
            phone,
            instagram,
            max_pax,
            is_active: true,
            is_sent: false
        })

    if (error) {
        console.error('Error adding invitee:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function editInvitee(id: string, formData: FormData) {
    const supabase = createSupabaseServerClient()

    const full_name = formData.get('full_name') as string
    const display_name = formData.get('display_name') as string || null
    const phone = formData.get('phone') as string || null
    const instagram = formData.get('instagram') as string || null
    const max_pax = parseInt(formData.get('max_pax') as string) || 2

    const { error } = await supabase
        .from('invitees')
        .update({
            full_name,
            display_name,
            phone,
            instagram,
            max_pax,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating invitee:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function addInviteeBulk(invitees: Partial<InviteeRow>[]) {
    const supabase = createSupabaseServerClient()

    const payload = invitees.map(inv => ({
        id: crypto.randomUUID(),
        full_name: inv.full_name,
        display_name: inv.display_name || null,
        phone: inv.phone || null,
        instagram: inv.instagram || null,
        max_pax: inv.max_pax || 2,
        is_active: true,
        is_sent: false
    }))

    const { error } = await supabase
        .from('invitees')
        .insert(payload)

    if (error) {
        console.error('Error adding bulk invitees:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteInvitee(id: string) {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
        .from('invitees')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting invitee:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

