# M ONE ERP — Warenwirtschafts- & Vertriebssystem

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **UI**: Lucide Icons, Recharts
- **Target**: Responsive Web-App / PWA

## Struktur
- `app/(admin)/` — Innendienst-Dashboard (Desktop)
- `app/(driver)/` — Fahrer-PWA (Mobile)
- `app/(auth)/` — Login/Auth
- `lib/actions/` — Server Actions (Mutations)
- `lib/queries/` — Data-Fetching
- `lib/supabase/` — Supabase Clients
- `components/` — UI-Komponenten
- `supabase/migrations/` — SQL Migrations

## Setup

```bash
npm install
cp .env.local.example .env.local
# Supabase URL + Keys eintragen
npm run dev
```

## Supabase
```bash
# Types generieren (nach Schema-Änderungen)
npm run supabase:types
```
