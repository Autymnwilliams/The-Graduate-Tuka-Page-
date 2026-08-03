# Tuka Hotel Pilot

A standalone, mobile-first web app for Tuka's hotel pilot program. Each hotel gets its own page (reached via an NFC tap or QR code at the front desk) showing that hotel's curated local recommendations, gated behind a signup form after a free preview.

This is not connected to Tuka's real backend — it's a self-contained pilot site with its own flat-file data storage, used to validate the concept.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Mapbox GL JS
- Flat JSON files per hotel (`/data/hotels/{slug}.json`)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Hotel pages live at `/{hotelSlug}` (e.g. `/hotelzachary`), with a signup screen at `/{hotelSlug}/signup`.
