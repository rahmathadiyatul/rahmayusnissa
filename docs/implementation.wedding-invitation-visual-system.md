---
title: Wedding Invitation Visual System
created: 2026-03-16
updated: 2026-03-16
version: 0.1.0
status: Draft
changelog:
  - version: 0.1.0
    date: 2026-03-16
    changes: "Defined visual direction, palette, typography, and animation style."
audience: UI developer
reference:
  - implementation.wedding-invitation-master-plan.md
  - architecture.wedding-invitation-component-map.md
---

# Wedding Invitation Visual System

## Summary
The visual style is elegant and cinematic with deep black surfaces, restrained silver texture, and selective
gold highlights. The layout should feel premium and modern while staying readable on mobile.

## Color System
- Primary background: #0b0b0c
- Secondary background: #151518
- Primary text: #f5f5f5
- Silver accent: #b8bcc6
- Muted silver: #8b909a
- Gold accent: #d4af37
- Dark gold: #9c7a1a

## Usage Rules
- Black dominates page surfaces and section backgrounds.
- Silver for borders, dividers, and subtle typography accents.
- Gold only for important highlights: CTA, names, countdown numbers, section ornaments.
- Avoid using bright colors that dilute the premium palette.

## Typography (Google Fonts, Free)
- Display serif: Cinzel
- Body serif: Cormorant Garamond
- Accent script (limited use for names/quotes): Great Vibes

## Spacing and Composition
- Use generous vertical spacing between sections.
- Keep content centered with a max width container for readability.
- Use asymmetric decorative elements sparingly to avoid visual clutter.

## Motion Direction
- Envelope open animation at intro.
- Scroll reveal with fade-up and slight parallax.
- Light particle or grain overlay near hero and closing sections.
- Gentle transitions for form submission states.
- Respect prefers-reduced-motion.

## Imagery Direction
- Placeholder ratio presets:
  - Hero: 16:9
  - Couple portraits: 4:5
  - Gallery tiles: mixed masonry
- Use monochrome overlays to maintain palette consistency before final photo curation.

## Audio Direction
- One background track with loop.
- Persistent floating control for play or pause.
- Default behavior should respect browser autoplay restrictions.
