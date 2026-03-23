import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { buildDashboardDetailContext } from '@/lib/dashboard/detail-context';

// Allow responses up to 5 minutes
export const maxDuration = 300;

function getLiteLLMBaseURL() {
    const raw = process.env.LITELLM_API;
    if (!raw) {
        throw new Error('Missing LITELLM_API environment variable.');
    }

    return `${raw.replace(/\/$/, '')}/v1`;
}

function getTavilyApiKey() {
    const raw = process.env.TAVILY_API_KEY;
    if (!raw) {
        throw new Error('Missing TAVILY_API_KEY environment variable.');
    }

    return raw;
}

export async function POST(req: Request) {
    const { messages } = await req.json();
    const aiProvider = (process.env.AI_PROVIDER || 'groq').toLowerCase();

    const groq = createGroq({
        apiKey: process.env.GROQ_API_KEY,
    });

    const litellm = createOpenAI({
        baseURL: getLiteLLMBaseURL(),
        apiKey: process.env.LITELLM_VIRTUAL_KEY,
    });

    const model = aiProvider === 'litellm'
        ? litellm(process.env.LITELLM_MODEL || 'qwen/qwen3.5-397b-a17b')
        : groq('llama-3.1-8b-instant', {
            parallelToolCalls: false,
        });

    const result = await streamText({
        model: model as any,
        messages,
        maxSteps: 5,
        system: `You are an intelligent, polite, and heavily capable Wedding Assistant. 
You are integrated into a wedding invitation dashboard.
You can perform actions on the "invitees" database.
The fields are: id, full_name, display_name, phone, instagram, max_pax (default 2), is_active, is_sent.

CRITICAL RULES:
1. BEFORE editing or deleting a user, if you only have a name (and no exact ID), ALWAYS use "search_invitee" first.
2. If "search_invitee" returns NO matches, DO NOT guess or hallucinate an ID. STOP and tell the user you could not find the person.
3. If "search_invitee" returns multiple people with the same name, STOP. Show the user the options along with their display_name, phone or instagram, and ask: "Which one do you mean?". Do not guess or pick the first one blindly.
4. When you add a new invitee using "add_invitee", the tool will return an "insertedId". You MUST reveal this ID to the user in your message (e.g., "Added Budi. Their ID is <id>.") so that it is established in the conversation history. This allows the user to immediately say "edit them" and you will already have the ID.
5. If the user asks you to add multiple people, use "add_multiple_invitees".
6. For updates and deletes, after you successfully run the tool, tell the user what was specifically accomplished.
7. When adding users, you can infer display_name from full_name if not provided. Phone numbers should contain only digits where possible.
8. NEVER call search_invitee AND edit_invitee/delete_invitee in the very same step. You MUST wait for the exact UUID from the search results before calling an edit/delete tool.
9. If the user asks to edit by name (without ID), prefer using "edit_invitee_by_name" so the server handles search + disambiguation deterministically.
10. If the user asks to delete by name (without ID), prefer using "delete_invitee_by_name" so the server handles search + disambiguation deterministically.
11. NEVER edit or delete invitees where is_sent=true. If requested, explain that sent invitees are locked for data integrity.
12. If the user asks for an overall dashboard/detail status summary, use "get_dashboard_detail_context" first before answering.
13. If the user asks for web/latest/external information, use "web_search" and cite the returned sources in your answer.

Keep responses relatively brief and let the Tool Calls do the heavy lifting.`,
        tools: {
            web_search: tool({
                description: 'Search the web for recent or external information using Tavily. Returns concise results with URLs.',
                parameters: z.object({
                    query: z.string().min(2).describe('What to search on the web.'),
                    maxResults: z.number().int().min(1).max(10).optional().describe('How many results to return (1-10). Defaults to 5.'),
                    searchDepth: z.enum(['basic', 'advanced']).optional().describe('Search depth for Tavily. Defaults to basic.'),
                }),
                execute: async ({ query, maxResults, searchDepth }: { query: string; maxResults?: number; searchDepth?: 'basic' | 'advanced' }) => {
                    const apiKey = getTavilyApiKey();

                    const response = await fetch('https://api.tavily.com/search', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            api_key: apiKey,
                            query,
                            max_results: maxResults ?? 5,
                            search_depth: searchDepth ?? 'basic',
                            include_answer: true,
                            include_raw_content: false,
                        }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        return {
                            success: false,
                            error: `Tavily request failed (${response.status}): ${errorText || 'Unknown error'}`,
                        };
                    }

                    const data = await response.json();
                    const results = Array.isArray(data?.results)
                        ? data.results.map((item: any) => ({
                            title: item?.title ?? '',
                            url: item?.url ?? '',
                            content: item?.content ?? '',
                            score: item?.score ?? null,
                        }))
                        : [];

                    return {
                        success: true,
                        query,
                        answer: data?.answer ?? null,
                        results,
                    };
                },
            }),

            get_dashboard_detail_context: tool({
                description: 'Retrieve the same aggregated context shown in /dashboard/detail for invitee delivery and pax status.',
                parameters: z.object({}),
                execute: async () => {
                    const supabase = createSupabaseServerClient();

                    const { data, error } = await supabase
                        .from('invitees')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (error) {
                        return { success: false, error: error.message };
                    }

                    const invitees = (data || []).map((invitee) => ({
                        ...invitee,
                        max_pax: invitee.max_pax ?? 0,
                    }));

                    const detailContext = buildDashboardDetailContext(invitees);

                    return {
                        success: true,
                        generatedAt: new Date().toISOString(),
                        detailContext,
                    };
                },
            }),

            search_invitee: tool({
                description: 'Search for an invitee by name to get their exact ID and details before editing or deleting.',
                parameters: z.object({
                    name: z.string().describe('The name (full or partial) to search for.'),
                }),
                execute: async ({ name }: { name: string }) => {
                    const supabase = createSupabaseServerClient();

                    // Simple search first
                    let { data, error } = await supabase
                        .from('invitees')
                        .select('*')
                        .or(`full_name.ilike.%${name}%,display_name.ilike.%${name}%`);

                    // If simple search fails but we have a multi-word name, try just the first name
                    if ((!data || data.length === 0) && name.includes(' ')) {
                        const firstName = name.split(' ')[0];
                        const fallback = await supabase
                            .from('invitees')
                            .select('*')
                            .or(`full_name.ilike.%${firstName}%,display_name.ilike.%${firstName}%`);
                        data = fallback.data;
                        error = fallback.error;
                    }

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
                    return { success: true, count: payload.length, message: `Successfully added ${payload.length} invitees. Here are their IDs.`, insertedIds: payload.map((p: any) => ({ name: p.full_name, id: p.id })) };
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

                    const { data: existing, error: existingError } = await supabase
                        .from('invitees')
                        .select('id, is_sent')
                        .eq('id', id)
                        .limit(1);

                    if (existingError) return { success: false, error: existingError.message };
                    if (!existing || existing.length === 0) return { success: false, error: "No invitee found with this ID. Make sure you used the exact UUID from search_invitee." };
                    if (existing[0].is_sent) {
                        return {
                            success: false,
                            reason: 'sent_locked',
                            message: `Cannot edit invitee ${id} because invitation is already sent.`,
                        };
                    }

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

            edit_invitee_by_name: tool({
                description: 'Update/edit an existing invitee by name. Use this when user does not provide ID. The server will search and safely handle not-found/multiple matches.',
                parameters: z.object({
                    name: z.string().describe('The full or partial name to search for.'),
                    full_name: z.string().optional(),
                    display_name: z.string().optional(),
                    phone: z.string().optional(),
                    instagram: z.string().optional(),
                    max_pax: z.number().optional(),
                }).refine((value) => {
                    const hasAnyUpdate = ['full_name', 'display_name', 'phone', 'instagram', 'max_pax']
                        .some((key) => (value as any)[key] !== undefined);
                    return hasAnyUpdate;
                }, {
                    message: 'At least one field must be provided for update.',
                }),
                execute: async ({ name, ...updates }: { name: string, full_name?: string, display_name?: string, phone?: string, instagram?: string, max_pax?: number }) => {
                    const supabase = createSupabaseServerClient();

                    let { data: matches, error: searchError } = await supabase
                        .from('invitees')
                        .select('id, full_name, display_name, phone, instagram, is_sent')
                        .or(`full_name.ilike.%${name}%,display_name.ilike.%${name}%`);

                    if ((!matches || matches.length === 0) && name.includes(' ')) {
                        const firstName = name.split(' ')[0];
                        const fallback = await supabase
                            .from('invitees')
                            .select('id, full_name, display_name, phone, instagram, is_sent')
                            .or(`full_name.ilike.%${firstName}%,display_name.ilike.%${firstName}%`);
                        matches = fallback.data;
                        searchError = fallback.error;
                    }

                    if (searchError) {
                        return { success: false, error: searchError.message };
                    }

                    const count = matches?.length || 0;
                    if (count === 0) {
                        return {
                            success: false,
                            reason: 'not_found',
                            message: `No invitee found for name "${name}".`,
                        };
                    }

                    if (count > 1) {
                        return {
                            success: false,
                            reason: 'ambiguous',
                            message: `Found ${count} invitees for "${name}". Please choose the exact person first.`,
                            matches,
                        };
                    }

                    const target = matches![0];
                    if (target.is_sent) {
                        return {
                            success: false,
                            reason: 'sent_locked',
                            message: `Cannot edit invitee "${target.full_name}" because invitation is already sent.`,
                        };
                    }

                    const cleanUpdates = Object.fromEntries(
                        Object.entries(updates).filter(([_, v]) => v !== undefined)
                    );

                    const { data: updated, error: updateError } = await supabase
                        .from('invitees')
                        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
                        .eq('id', target.id)
                        .select('id, full_name, display_name, phone, instagram, max_pax');

                    if (updateError) return { success: false, error: updateError.message };
                    if (!updated || updated.length === 0) return { success: false, error: 'Update failed: invitee not found during update step.' };

                    revalidatePath('/dashboard', 'layout');
                    return {
                        success: true,
                        message: `Updated invitee by name "${name}" successfully.`,
                        updatedInvitee: updated[0],
                    };
                },
            }),

            delete_invitee: tool({
                description: 'Delete an invitee from the database. You MUST have the exact ID from search_invitee to use this.',
                parameters: z.object({
                    id: z.string().describe('The exact UUID of the invitee to delete.'),
                }),
                execute: async ({ id }: { id: string }) => {
                    const supabase = createSupabaseServerClient();

                    const { data: existing, error: existingError } = await supabase
                        .from('invitees')
                        .select('id, is_sent')
                        .eq('id', id)
                        .limit(1);

                    if (existingError) return { success: false, error: existingError.message };
                    if (!existing || existing.length === 0) return { success: false, error: "No invitee found with this ID. Make sure you used the exact UUID from search_invitee." };
                    if (existing[0].is_sent) {
                        return {
                            success: false,
                            reason: 'sent_locked',
                            message: `Cannot delete invitee ${id} because invitation is already sent.`,
                        };
                    }

                    const { data, error } = await supabase.from('invitees').delete().eq('id', id).select();

                    if (error) return { success: false, error: error.message };
                    if (!data || data.length === 0) return { success: false, error: "No invitee found with this ID. Make sure you used the exact UUID from search_invitee." };

                    revalidatePath('/dashboard', 'layout');
                    return { success: true, message: `Deleted invitee ${id}.` };
                }
            }),

            delete_invitee_by_name: tool({
                description: 'Delete an invitee by name. Use this when user does not provide ID. The server will search and safely handle not-found/multiple matches.',
                parameters: z.object({
                    name: z.string().describe('The full or partial name to search for.'),
                }),
                execute: async ({ name }: { name: string }) => {
                    const supabase = createSupabaseServerClient();

                    let { data: matches, error: searchError } = await supabase
                        .from('invitees')
                        .select('id, full_name, display_name, phone, instagram, is_sent')
                        .or(`full_name.ilike.%${name}%,display_name.ilike.%${name}%`);

                    if ((!matches || matches.length === 0) && name.includes(' ')) {
                        const firstName = name.split(' ')[0];
                        const fallback = await supabase
                            .from('invitees')
                            .select('id, full_name, display_name, phone, instagram, is_sent')
                            .or(`full_name.ilike.%${firstName}%,display_name.ilike.%${firstName}%`);
                        matches = fallback.data;
                        searchError = fallback.error;
                    }

                    if (searchError) {
                        return { success: false, error: searchError.message };
                    }

                    const count = matches?.length || 0;
                    if (count === 0) {
                        return {
                            success: false,
                            reason: 'not_found',
                            message: `No invitee found for name "${name}".`,
                        };
                    }

                    if (count > 1) {
                        return {
                            success: false,
                            reason: 'ambiguous',
                            message: `Found ${count} invitees for "${name}". Please choose the exact person first.`,
                            matches,
                        };
                    }

                    const target = matches![0];
                    if (target.is_sent) {
                        return {
                            success: false,
                            reason: 'sent_locked',
                            message: `Cannot delete invitee "${target.full_name}" because invitation is already sent.`,
                        };
                    }

                    const { data: deleted, error: deleteError } = await supabase
                        .from('invitees')
                        .delete()
                        .eq('id', target.id)
                        .select('id, full_name, display_name, phone, instagram');

                    if (deleteError) return { success: false, error: deleteError.message };
                    if (!deleted || deleted.length === 0) return { success: false, error: 'Delete failed: invitee not found during delete step.' };

                    revalidatePath('/dashboard', 'layout');
                    return {
                        success: true,
                        message: `Deleted invitee by name "${name}" successfully.`,
                        deletedInvitee: deleted[0],
                    };
                }
            })
        },
    });

    return result.toDataStreamResponse();
}
