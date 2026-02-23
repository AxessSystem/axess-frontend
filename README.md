# AXESS Frontend

React + Vite frontend for the Axess Event OS & Marketing Engine.

## Tech Stack

- **React 18** + **Vite 5**
- **Supabase JS** — Auth + Data
- **TailwindCSS 3** — Dark mode, WhatsApp green theme
- **React Router 6** — Client-side routing
- **TanStack Query 5** — Data fetching & cache
- **Recharts** — KPI charts
- **PapaParse** — CSV parsing
- **React Hot Toast** — Notifications

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Supabase SQL

Run `supabase/profiles.sql` in your Supabase SQL Editor to create the profiles table.

### 4. Create admin user

1. Go to Supabase Dashboard → Authentication → Users → Invite User
2. After creation, run in Supabase SQL Editor:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```

### 5. Create producer user

1. Invite user in Supabase Auth
2. Find their UUID in auth.users
3. Run:
   ```sql
   UPDATE profiles 
   SET role = 'producer', producer_id = 'PRODUCER_UUID_FROM_PRODUCERS_TABLE'
   WHERE email = 'producer@email.com';
   ```

### 6. Start dev server

```bash
npm run dev
```

Open: http://localhost:5173

## Pages

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page | Public |
| `/login` | Login | Public |
| `/admin` | Admin dashboard | Admin only |
| `/admin/audience` | Audience management | Admin only |
| `/admin/producers` | Producers management | Admin only |
| `/admin/events` | Events + CSV upload | Admin only |
| `/admin/transactions` | Transactions + check-in | Admin only |
| `/admin/tables` | Tables & pricing | Admin only |
| `/admin/marketing` | Marketing campaigns | Admin only |
| `/admin/activity` | System activity log | Admin only |
| `/producer` | Producer dashboard | Producer only |
| `/producer/events` | My events + CSV | Producer only |
| `/producer/tables` | Tables & upsells | Producer only |
| `/producer/marketing` | WhatsApp marketing | Producer only |
| `/producer/reports` | Sales reports | Producer only |

## Build for Production

```bash
npm run build
npm run preview
```

## Deploy on Railway

1. Create new Railway service pointing to this directory
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build command: `npm install && npm run build`
4. Start command: `npm run preview`
