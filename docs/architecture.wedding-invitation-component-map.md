---
title: Wedding Invitation Component Map
created: 2026-03-16
updated: 2026-03-16
version: 0.1.0
status: Draft
changelog:
  - version: 0.1.0
    date: 2026-03-16
    changes: "Initial component map and file organization plan."
audience: Frontend developer
reference:
  - implementation.wedding-invitation-master-plan.md
---

# Wedding Invitation Component Map

## Overview
This document maps each invitation section to reusable React components and proposes initial file placement
for a scalable Next.js App Router implementation.

## Proposed File Structure
- app/layout.tsx
- app/page.tsx
- app/globals.css
- app/wedding/page.tsx (reads `invitee` from query string)
- components/invitation/envelope-entry.tsx
- components/invitation/hero-section.tsx
- components/invitation/countdown-section.tsx
- components/invitation/couple-section.tsx
- components/invitation/quote-section.tsx
- components/invitation/events-section.tsx
- components/invitation/rsvp-section.tsx
- components/invitation/gallery-section.tsx
- components/invitation/gift-section.tsx
- components/invitation/wishes-section.tsx
- components/invitation/closing-section.tsx
- components/invitation/music-player.tsx
- components/ui/section-shell.tsx
- lib/types.ts
- lib/content.ts
- lib/date.ts
- lib/validation.ts

## Component Responsibilities
- EnvelopeEntry: intro overlay with open button and invitee name.
- HeroSection: title, date, and background image.
- CountdownSection: live time countdown to main event.
- CoupleSection: bride and groom profile cards.
- QuoteSection: thematic wedding quote content.
- EventsSection: Akad and Resepsi cards with map links.
- RSVPSection: attendance form with name, pax, confirmation choice.
- GallerySection: responsive image grid and lightbox-ready structure.
- GiftSection: account or QR info and optional transfer confirmation form.
- WishesSection: form submission and live stream style wish list.
- ClosingSection: final statement and gratitude copy.
- MusicPlayer: persistent play/pause, volume, and track metadata.

## State Boundaries
- Global page state:
  - isInvitationOpened
  - activeInvitee
  - inviteeUuid (from `searchParams.invitee`)
  - musicState
- Section local state:
  - RSVP form values and pending submission
  - Gift confirmation form values
  - Wishes form values

## Performance Guidance
- Use Next Image for all section visuals.
- Use dynamic imports for heavy visual features (particle background, gallery lightbox).
- Lazy render below-the-fold sections when practical.
- Keep animation runtime efficient with CSS transforms and opacity.

## Responsive Strategy
- Build for 360px to 430px viewport widths first.
- Use fluid typography and spacing with clamp() for key text blocks.
- Keep sticky or floating controls thumb-reachable on mobile.
- Enhance layout progressively for tablet and desktop breakpoints.

## Accessibility Guidance
- Keyboard focus order starts at envelope open button.
- Sufficient contrast for text on dark backgrounds.
- Reduced motion mode supported for sensitive users.
- Form fields have labels, errors, and screen reader hints.
