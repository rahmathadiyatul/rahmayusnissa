---
title: Dashboard Implementation Plan
created: 2026-03-20
updated: 2026-03-24
version: 1.1.0
status: Completed
changelog:
  - version: 1.0.0
    date: 2026-03-20
    changes: "Initial completion of dashboard for invitee management"
  - version: 1.1.0
    date: 2026-03-24
    changes: "Added detail undangan with graphs, responsive layout via hamburger menu, and route loading states."
audience: Bride & Groom
reference: 
  - none
---
# Dashboard Implementation Plan

## Overview
A secure, mobile-first dashboard for the bride to manage the wedding invitation list, send personalized invitations via WhatsApp or Instagram, and track their sent status.

## 1. Authentication & Security
- **Method:** Simple password protection using environment variables.
- **Config:** Store `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` in `.env.local`.
- **Implementation:** 
  - A `/dashboard/login` page.
  - Upon successful login, set a secure HTTP-only cookie.
  - A Next.js middleware or layout check to protect all `/dashboard/*` routes.

## 2. Database Schema Updates
The `public.invitees` table currently has `id`, `full_name`, `display_name`, `phone`, `max_pax`, `is_active`, `created_at`, `updated_at`.
We will add:
- `instagram` (text)
- `is_sent` (boolean, default: false)

## 3. Core Features & UX
- **Mobile First Focus:** Since the user will primarily use a mobile phone, a traditional wide table won't fit perfectly. The UI will use a "Card List" approach on mobile (showing Name, Status, and Actions) and a "Data Table" on desktop.
- **Navigation & Layout:**
  - Responsive layout structured with `DashboardLayoutClient` handling the app shell state.
  - Mobile features a toggleable Hamburger Menu that controls a slide-out overlay backdrop.
  - Desktop features a sticky sidebar so navigation remains available even when scrolling through long lists.
  - Admin layout routes are wrapped in a `loading.tsx` Suspense boundary featuring a custom spinning ring for instant navigation feedback to prevent frozen-UI perceptions.
- **Top Actions:**
  - A sticky top bar or fixed header containing the **Search by Name** input, a `<select>` dropdown **Status Filter (Semua, Terkirim, Belum)** dynamically reacting alongside text search, and an **Add Invitee** button.
- **Detail Undangan Page (/dashboard/detail):**
  - Displays aggregated statistical counter cards for: Total Undangan, Terkirim, Pax Terkirim, Total Semua Pax.
  - Features an "overview-chart" built via `recharts` presenting a side-by-side grouped Bar Chart to visually map and compare Sent vs Unsent metrics.
- **Invitee Actions:**
  - **Edit:** Opens a modal to edit details (Phone, IG, Name, etc.).
  - **Send to WA:** Opens `wa.me/<phone>?text=<encoded_template>`.
  - **Send to IG:** Copies the message to the clipboard and opens `instagram.com/<instagram>`.
  - **Mark as Sent:** A quick toggle to manually update the `is_sent` status after sending the message.

## 4. Message Template
The message will dynamically replace `[Nama Invitee]` mapping to their `display_name` or `full_name` and the `[Invitee UUID]` for their personalized link. I've polished the template to be more elegant and readable for WhatsApp, using subtle emojis to break up the text.

**Template:**
```text
Assalamu'alaikum Warahmatullahi Wabarakatuh,

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i [Nama Invitee] untuk menghadiri acara pernikahan kami:

*Rahma Yus Nissa, S.Pt (Nissa)*
Putri ke-4 dari Bapak (alm) H. Yusmin RB & Ibu Betmawati
&
*Afdal Rahmadhani (Afdal)*
Putra ke-4 dari Bapak Eman & Ibu Nurhayani

Yang Insya Allah akan dilaksanakan pada:

*AKAD NIKAH & RESEPSI*
Hari, Tanggal: Sabtu, 4 April 2026
Waktu: 08.00 WIB s/d Selesai
Alamat: Jln. Zahlul St. Kebesaran No. 43 RT 002 RW 005 Kel. Simpang Rumbio, Kec. Lubuk Sikarah, Kota Solok.

Berikut tautan undangan digital kami untuk informasi lebih lengkap:
https://ica-afdal.com/wedding?invitee=[Invitee UUID]

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Terima kasih banyak atas perhatian dan doa restunya.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
```

## 5. Implementation Steps
1. **Database:** Execute SQL script to add new columns.
2. **Auth Setup:** Create login page and simple cookie-based session management.
3. **Data Fetching:** Create Server Actions or API routes for Create, Read, Update invitees.
4. **UI Components:**
   - Dashboard Layout & Navigation
   - Search Bar & Add Button
   - Invitee List (Responsive Data Table / Cards)
   - Add/Edit Modal
5. **Interactive Features:** Implement WhatsApp prefilling, IG clipboard copying, and status toggling.- **Import from Contacts (PWA/Android):** Use the `navigator.contacts` Contact Picker API when accessed on an Android device to allow bulk importing names and phone numbers directly from the phone's address book.
