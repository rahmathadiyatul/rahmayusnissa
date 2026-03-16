---
title: Wedding E-Invitation Master Plan
created: 2026-03-16
updated: 2026-03-16
version: 0.1.0
status: Draft
changelog:
  - version: 0.1.0
    date: 2026-03-16
    changes: "Initial modular implementation plan based on confirmed requirements."
audience: Project owner and implementer
reference:
  - architecture.wedding-invitation-component-map.md
  - implementation.wedding-invitation-data-and-rsvp-plan.md
  - implementation.wedding-invitation-visual-system.md
  - deployment.wedding-invitation-release-plan.md
---

# Wedding E-Invitation Master Plan

## Summary
This project builds a single-page wedding e-invitation web app in Next.js with an envelope-style entry,
animated scrolling sections, RSVP and wishes features, gallery placeholders, and later Supabase integration.

## Confirmed Requirements
- Visual theme: elegant and classy with black as dominant color, silver and gold as accents.
- App type: one-page invitation with section-by-section scrolling experience.
- Personalization: per-invitee UUID in invite URL.
- URL format: `https://ica-afdal.com/wedding?invitee=<UUID>`.
- Device priority: mobile-first responsive experience (desktop as secondary enhancement).
- Data backend: Supabase (to be integrated when keys are provided).
- Hosting: test on Netlify, then map domain ica-afdal.com.
- Media: placeholders for now, real prewedding photos added later.

## Event Data (Current Source)
- Bride: Rahma Yus Nissa, S.Pt (Nissa), daughter of (late) H. Yusmin RB and Betmawati.
- Groom: Afdal Rahmadhani (Afdal), son of Eman and Nurhayani.
- Akad Nikah: Saturday, 4 April 2026, 08.00 WIB until finish.
- Resepsi: Saturday, 4 April 2026, 10.00 WIB until finish.
- Venue for both events: Jln. Zahlul St. Kebesaran No. 43 RT 002 RW 005 Kel. Simpang Rumbio,
  Kec. Lubuk Sikarah, Kota Solok.

## Planned Sections (One-Page Flow)
1. Envelope Entry (open invitation CTA)
2. Hero (wedding title + couple image background)
3. Countdown / Save the Date
4. Couple Profile (bride and groom details)
5. Quote Section
6. Event Details (Akad and Resepsi)
7. RSVP Form
8. Gallery
9. Wedding Gift Information + gift confirmation form
10. Live Wishes Stream (form + feed)
11. Closing Section (repeated wedding statement)

## Delivery Phases
1. Foundation and design system
2. Static section implementation and animation pass
3. Form integration and validation
4. Supabase integration (invite, RSVP, wishes, gift confirmation)
5. QA, performance, and deployment hardening

## Immediate Next Build Targets
- Set up global style tokens (black, silver, gold), typography, spacing, and motion presets.
- Build envelope entry and core section skeleton in app page.
- Add placeholder content and images for all sections.
- Add client-side form validation before backend integration.

## Open Decisions
- Hero and closing now use real event date text: Sabtu, 4 April 2026.
- Couple display for invitation branding is set to: Ica & Afdal.
- RSVP V1 fields fixed for simplicity: nama, jumlah tamu, konfirmasi hadir/tidak hadir.
- Wishes stream is auto-publish for current version.
- Full content language is Bahasa Indonesia.
- Music source file still pending (control behavior already planned and implemented).

## Success Criteria
- Fully responsive one-page invitation on mobile and desktop.
- Personalized query-string URL works: `/wedding?invitee=<UUID>`.
- Smooth scroll and animation experience with elegant visual consistency.
- UUID invite personalization works end-to-end once Supabase is enabled.
- RSVP and wishes data persist reliably after backend integration.
