---
title: Wedding Invitation Data and RSVP Plan
created: 2026-03-16
updated: 2026-03-16
version: 0.1.0
status: Draft
changelog:
  - version: 0.1.0
    date: 2026-03-16
    changes: "Defined UUID personalization flow and Supabase data model draft."
audience: Full-stack developer
reference:
  - implementation.wedding-invitation-master-plan.md
  - deployment.wedding-invitation-release-plan.md
---

# Wedding Invitation Data and RSVP Plan

## Summary
This plan defines the UUID-based invite model and data collections for RSVP, wishes, and gift confirmations.
Supabase is the target backend.

## Personalization Strategy
- Invite URL format: /wedding?invitee={invite_uuid}
- Each invitee receives one UUID.
- Page reads `invitee` query param and loads invitee profile.
- If UUID is invalid, show polite fallback and contact info.

## Draft Data Model (Supabase)

## Table: invitees
- id: uuid primary key
- slug: text unique (optional human-readable alias)
- full_name: text not null
- display_name: text nullable
- phone: text nullable
- max_pax: integer default 2
- tags: text[] nullable
- is_active: boolean default true
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

## Table: rsvps
- id: uuid primary key
- invitee_id: uuid references invitees(id)
- name: text not null
- pax: integer not null
- attendance: text check in ('yes','no')
- note: text nullable
- submitted_at: timestamptz default now()

## Table: wishes
- id: uuid primary key
- invitee_id: uuid references invitees(id)
- name: text not null
- message: text not null
- submitted_at: timestamptz default now()
- is_approved: boolean default true

## Table: gift_confirmations
- id: uuid primary key
- invitee_id: uuid references invitees(id)
- sender_name: text not null
- transfer_bank: text nullable
- transfer_amount: numeric nullable
- message: text nullable
- submitted_at: timestamptz default now()

## API and Validation Plan
- Validate all form input on client and server.
- Use zod schemas for request payload validation.
- Sanitize message fields to block script injection.
- Rate-limit wishes submission to reduce spam.

## Pending Decisions
- RSVP V1 is fixed to minimal fields: name, pax, and attendance status.
- Wishes moderation for current version: auto publish.
- Need confirmation if one invitee can submit multiple RSVPs or only latest submission should remain.

## Integration Milestones
1. Create Supabase project and environment variables.
2. Apply schema migration for invitees, rsvps, wishes, gift_confirmations.
3. Build server actions or route handlers for each form.
4. Connect live wishes feed with polling or realtime.
