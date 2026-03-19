import { createGroq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Allow responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const groq = createGroq({
        apiKey: process.env.GROQ_API_KEY,
    });

    const result = await streamText({
        model: groq('llama-3.1-8b-instant', {
            parallelToolCalls: false,
        }) as any,
        messages,
        maxSteps: 5,
        system: `You are an intelligent, polite, and heavily capable Wedding Assistant. 
You are integrated into a wedding invitation dashboard.
You can perform actions on the "invitees" database.
The fields are: id, full_name, display_name, phone, instagram, max_pax (default 2).

CRITICAL RULES:
1. BEFORE editing or deleting a user, if you only have a name (and no exact ID), ALWAYS use "search_invitee" first.
2. If "search_invitee" returns multiple people with the same name, STOP. Show the user the options along with their display_name, phone or instagram, and ask: "Which one do you mean?". Do not guess or pick the first one blindly.
3. If "search_invitee" returns NO matches, tell the user the person could not be found.
4. If the user asks you to add multiple people, use "add_multiple_invitees".
5. For updates and deletes, after you successfully run the tool, tell the user what was specifically accomplished.
6. When adding users, you can infer display_name from full_name if not provided (e.g. Full: Budi Setiawan -> Display: Budi). Phone numbers should contain only digits where possible.
7. NEVER apologize excessively. Be snappy and concise.
8. NEVER call search_invitee and edit_invitee/delete_invitee in the same step. You MUST wait for the search results to come back with the exact UUID before proceeding.

Keep responses relatively brief and let the Tool Calls do the heavy lifting.`,
        tools: {
            search_invitee: tool({
                description: 'Search for an invitee by name to get their exact ID and details before editing or deleting.',
                parameters: z.object({
                    name: z.string().describe('The name (full or partial) to search for.'),
                }),
                execute: async ({ name }: { name: string }) => {
                    const supabase = createSupabaseServerClient();
                    const { data, error } = await supabase
                        .from('invitees')
                        .select('*')
                        .ilike('full_name', `%${name}%`);

                    if (error) throw new Error(error.message);
                    return { results: data, count: data?.length || 0 };
                },
            }),

            add_invitee: tool({
                description: 'Add a single new invitee to the dashboard.',
                parameters: z.object({
                    full_name: z.string().describe('The full name of the invitee.'),
                    display_name: z.string().optional().describe('A shorter or preferred calling name.'),
                    phone: z.string().optional().describe('WhatsApp or phone number.'),
                    instagram: z.string().optional().describe('Instagram handle, ideally starting with @.'),
                    max_pax: z.number().optional().describe('Maximum number of pax (guests) allowed. Defaults to 2 if unknown.'),
                }),
                execute: async ({ full_name, display_name, phone, instagram, max_pax }: { full_name: string, display_name?: string, phone?: string, instagram?: string, max_pax?: number }) => {
                    const supabase = createSupabaseServerClient();
                    const id = crypto.randomUUID();
                    const { error } = await supabase.from('invitees').insert({
                        id,
                        full_name,
                        display_name: display_name || null,
                        phone: phone || null,
                        instagram: instagram || null,
                        max_pax: max_pax || 2,
                        is_active: true,
                        is_sent: false
                    });

                    if (error) return { success: false, error: error.message };
                    revalidatePath('/dashboard', 'layout');
                    return { success: true, message: `Added ${full_name} successfully.`, insertedId: id };
                },
            }),

            add_multiple_invitees: tool({
                description: 'Add multiple invitees at once in bulk.',
                parameters: z.object({
                    invitees: z.array(z.object({
                        full_name: z.string(),
                        display_name: z.string().optional(),
                        phone: z.string().optional(),
                        instagram: z.string().optional(),
                        max_pax: z.number().optional(),
                    }))
                }),
                execute: async ({ invitees }: { invitees: Array<{ full_name: string, display_name?: string, phone?: string, instagram?: string, max_pax?: number }> }) => {
                    const supabase = createSupabaseServerClient();
                    const payload = invitees.map((inv: any) => ({
                        id: crypto.randomUUID(),
                        full_name: inv.full_name,
                        display_name: inv.display_name || null,
                        phone: inv.phone || null,
                        instagram: inv.instagram || null,
                        max_pax: inv.max_pax || 2,
                        is_active: true,
                        is_sent: false
                    }));

                    const { error } = await supabase.from('invitees').insert(payload);
                    if (error) return { success: false, error: error.message };
                    revalidatePath('/dashboard', 'layout');
                    return { success: true, count: payload.length, message: `Successfully added ${payload.length} invitees.` };
                },
            }),

            edit_invitee: tool({
                description: 'Update/edit an existing invitee. You MUST have the exact ID from search_invitee to use this.',
                parameters: z.object({
                    id: z.string().describe('The UUID of the invitee to edit.'),
                    full_name: z.string().optional(),
                    display_name: z.string().optional(),
                    phone: z.string().optional(),
                    instagram: z.string().optional(),
                    max_pax: z.number().optional(),
                }),
                execute: async ({ id, ...updates }: { id: string, full_name?: string, display_name?: string, phone?: string, instagram?: string, max_pax?: number }) => {
                    const supabase = createSupabaseServerClient();

                    // Filter out undefined values
                    const cleanUpdates = Object.fromEntries(
                        Object.entries(updates).filter(([_, v]) => v !== undefined)
                    );

                    const { data, error } = await supabase
                        .from('invitees')
                        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
                        .eq('id', id)
                        .select();

                    if (error) return { success: false, error: error.message };
                    if (!data || data.length === 0) return { success: false, error: "No invitee found with this ID. Make sure you used the exact UUID from search_invitee." };

                    revalidatePath('/dashboard', 'layout');
                    return { success: true, message: `Updated invitee ${id} with new data.` };
                },
            }),

            delete_invitee: tool({
                description: 'Delete an invitee from the database. You MUST have the exact ID from search_invitee to use this.',
                parameters: z.object({
                    id: z.string().describe('The exact UUID of the invitee to delete.'),
                }),
                execute: async ({ id }: { id: string }) => {
                    const supabase = createSupabaseServerClient();
                    const { data, error } = await supabase.from('invitees').delete().eq('id', id).select();

                    if (error) return { success: false, error: error.message };
                    if (!data || data.length === 0) return { success: false, error: "No invitee found with this ID. Make sure you used the exact UUID from search_invitee." };

                    revalidatePath('/dashboard', 'layout');
                    return { success: true, message: `Deleted invitee ${id}.` };
                }
            })
        },
    });

    return result.toDataStreamResponse();
}
