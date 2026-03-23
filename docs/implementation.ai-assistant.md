---
title: AI Assistant Implementation
created: 2026-03-20
updated: 2026-03-24
version: 1.2.0
status: Completed
changelog:
  - version: 1.0.0
    date: 2026-03-20
    changes: "Initial plan for Groq-powered AI Assistant."
  - version: 1.1.0
    date: 2026-03-24
    changes: "Added auto-refresh sync via layout props and robust markdown table support."
  - version: 1.2.0
    date: 2026-03-24
    changes: "Added dashboard detail context tool and Tavily web search tool, plus dual-provider model routing (Groq/LiteLLM)."
audience: Developer
reference:
  - implementation.dashboard-management.md
---

# AI Assistant with Tool Calling

## Overview
The dashboard uses a floating AI assistant built with Vercel AI SDK + tool calling.
It supports invitee operations, dashboard summary retrieval, and external web research.

Current server route: `app/api/chat/route.ts`

## 1. Technical Stack
- **Provider Router:**
  - Groq (`@ai-sdk/groq`), default fallback
  - LiteLLM/OpenAI-compatible (`@ai-sdk/openai`)
- **LLM/Model (current defaults):**
  - Groq: `llama-3.1-8b-instant`
  - LiteLLM: `qwen/qwen3.5-397b-a17b` (configurable)
- **Framework integration:** `ai` (Vercel AI SDK)
- **Validation:** `zod` for strongly typed tool parameters.
- **External Search Provider:** Tavily API (`https://api.tavily.com/search`)

## 2. Tools (Function Calling)
The assistant currently exposes these tools:

- `search_invitee`
  - Searches invitees by `full_name` or `display_name`.
  - Includes first-name fallback when full query has no match.

- `add_invitee`
  - Adds one invitee and returns `insertedId`.

- `add_multiple_invitees`
  - Bulk insert invitees and returns per-person IDs.

- `edit_invitee`
  - Edits by exact UUID.
  - Prevents editing invitees with `is_sent = true` (sent-locked).

- `edit_invitee_by_name`
  - Server-side search + deterministic disambiguation.
  - Returns `not_found`, `ambiguous`, or `sent_locked` states when relevant.

- `delete_invitee`
  - Deletes by exact UUID.
  - Prevents deletion when `is_sent = true` (sent-locked).

- `delete_invitee_by_name`
  - Server-side search + deterministic disambiguation.
  - Returns `not_found`, `ambiguous`, or `sent_locked` states when relevant.

- `get_dashboard_detail_context`
  - Returns aggregated context aligned with `/dashboard/detail` page metrics.
  - Backed by shared builder in `lib/dashboard/detail-context.ts`.
  - Output includes totals and chart data:
    - total invitees
    - sent/unsent invitees
    - sent pax/total pax
    - sent rate percentage

- `web_search`
  - Performs web search via Tavily for latest/external information.
  - Parameters: `query`, optional `maxResults` (1-10), optional `searchDepth` (`basic`/`advanced`).
  - Returns concise results with source URLs and optional answer summary.

## 3. UI/UX
- A floating chat bubble placed on the bottom right `layout.tsx` of the admin dashboard.
- Utilizes `useChat` hook for streaming realtime text.
- Visually shows when a tool is running and whether it succeeded/failed.
- **Reactive Consistency:** Safely re-fetches Data (`revalidatePath` server side + `router.refresh()` client-side) when a mutation finishes.
- **Client Synchronization:** Dashboard list state is reset from fresh props via `useEffect` to keep UI synchronized.
- **Rich Markdown Formatting:** Implements `<ReactMarkdown>` using native mappings injected with Tailwind classes (lists, strongs). Employs `remark-gfm` to elegantly construct styled, horizontal-scrolling responsive table interfaces out of the AI's standard markdown table tokens.

## 4. Prompt Safety and Behavior Rules
System prompt enforces the following behaviors:

- Search before destructive operations when ID is not explicit.
- Never hallucinate IDs when search returns empty.
- Force disambiguation when multiple invitees match.
- Reveal inserted ID after add operations.
- Avoid edit/delete operations for sent invitees (`is_sent = true`).
- Use `get_dashboard_detail_context` for whole-dashboard status summaries.
- Use `web_search` for latest/external web information and cite sources.

## 5. Environment Variables
Required keys currently used by the assistant route:

- `AI_PROVIDER` (`groq` or `litellm`)
- `GROQ_API_KEY`
- `LITELLM_API`
- `LITELLM_VIRTUAL_KEY`
- `LITELLM_MODEL` (optional; default is configured in route)
- `TAVILY_API_KEY`

## 6. Related Files
- `app/api/chat/route.ts`
- `app/components/ChatAssistant.tsx`
- `lib/dashboard/detail-context.ts`
- `app/dashboard/(admin)/detail/page.tsx`

## 7. Operational Notes
- If `.env.local` changes, restart the Next.js dev server.
- Web search depends on Tavily service availability and API quota.
- Dashboard summary answers should stay consistent with `/dashboard/detail` because both rely on shared aggregation logic.
