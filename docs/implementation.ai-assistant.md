---
title: AI Assistant Implementation Plan
created: 2026-03-20
updated: 2026-03-20
version: 1.0.0
status: In Progress
changelog:
  - version: 1.0.0
    date: 2026-03-20
    changes: "Initial plan for Groq-powered AI Assistant."
audience: Developer
reference:
  - implementation.dashboard-management.md
---

# AI Assistant with Tool Calling (Groq + Vercel AI SDK)

## Overview
Introduce a floating chat assistant powered by Groq (using Llama-3-70b-8192) and the Vercel AI SDK. This assistant allows the dashboard admin to perform CRUD operations on the wedding invitee list via natural language.

## 1. Technical Stack
- **Provider:** Groq (`@ai-sdk/groq`)
- **LLM/Model:** `llama3-70b-8192` (Extremely fast, great at tool calling)
- **Framework integration:** `ai` (Vercel AI SDK)
- **Validation:** `zod` for strongly typed tool parameters.

## 2. Tools (Function Calling)
The AI will be equipped with the following tools:
- `search_invitee`: Look up users by name.
  - *Purpose:* Prevent ambiguous edits/deletes. If multiple people share a name, the AI will use this tool's response to ask the user for clarification.
- `add_invitee`: Add a single invitee to the database.
- `add_multiple_invitees`: Bulk add an array of invitees.
- `edit_invitee`: Update an invitee using their unique `id`.
- `delete_invitee`: Remove an invitee using their unique `id`.

## 3. UI/UX
- A floating chat bubble placed on the bottom right `layout.tsx` of the admin dashboard.
- Utilizes `useChat` hook for streaming realtime text.
- Visually shows when a tool is running (e.g., a small loading spinner: "Searching for Rahmat...").
- Safely refreshes the dashboard data (`router.refresh()`) when a mutation tool finishes.

## 4. Implementation Steps
1. Document the plan. *(You are here)*
2. Install dependencies: `npm install ai @ai-sdk/groq zod`.
3. Create the API route (`POST /api/chat/route.ts`) and define the System Prompt + Tool definitions.
4. Build the floating `<ChatAssistant />` UI component.
5. Integrate `<ChatAssistant />` into the `app/dashboard/(admin)/layout.tsx` file.
6. Provide instructions to the user to add `GROQ_API_KEY` to their `.env.local`.