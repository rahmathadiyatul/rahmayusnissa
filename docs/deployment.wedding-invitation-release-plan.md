---
title: Wedding Invitation Release Plan
created: 2026-03-16
updated: 2026-03-16
version: 0.1.0
status: Draft
changelog:
  - version: 0.1.0
    date: 2026-03-16
    changes: "Defined implementation milestones, QA checkpoints, and deployment steps."
audience: Project owner and implementer
reference:
  - implementation.wedding-invitation-master-plan.md
  - implementation.wedding-invitation-data-and-rsvp-plan.md
---

# Wedding Invitation Release Plan

## Milestones
1. M1: Page skeleton and design tokens
2. M2: Full section UI with placeholders and animation pass
3. M3: Forms wired to temporary local handlers
4. M4: Supabase integration (invite UUID, RSVP, wishes, gift)
5. M5: QA, performance, and Netlify deployment

## QA Checklist
- Mobile first layout across common phone sizes.
- Verify primary experience on mobile browsers before desktop polish.
- Desktop polish at 1280px and above.
- Form validation and error states tested.
- Countdown accuracy for WIB timezone.
- Music controls work on iOS and Android browsers.
- Basic accessibility checks: focus, labels, contrast.

## Deployment Plan (Netlify)
1. Push project to Git repository.
2. Connect repository in Netlify.
3. Set build command and publish output for Next.js.
4. Add environment variables for Supabase when ready.
5. Verify preview URL and production URL.
6. Configure custom domain ica-afdal.com.

## Risk List and Mitigation
- Risk: Browser blocks autoplay music.
- Mitigation: start muted, show clear play CTA after envelope open.

- Risk: Too many heavy images reduce performance.
- Mitigation: compress images, use Next Image optimization, lazy load below fold.

- Risk: Spam in wishes stream.
- Mitigation: server-side validation, rate limiting, optional moderation flag.

## Definition of Done
- Invite link using `/wedding?invitee=<UUID>` renders personalized greeting.
- All sections implemented and responsive.
- RSVP, wishes, and gift confirmation persist to Supabase.
- Domain points to deployed site and SSL is active.
