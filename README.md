This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# Prices.ai

Track food prices across markets with Next.js + Tailwind. Includes mock scraping, AI-style normalization (regex stub), and optional Supabase persistence.

## Stack
- Next.js (App Router) + TypeScript
- TailwindCSS
- Recharts
- Supabase (optional)

## Getting Started
1. Install Node 18+
2. Install deps:
```bash
npm install
```
3. Run dev server:
```bash
npm run dev
```
Open `http://localhost:3000`.

## Environment Variables
Create `.env.local` if using Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
If env is missing, endpoints fall back to mock data.

## Database (Supabase)
SQL files in `supabase/`:
- `schema.sql`
- `seed.sql`
Run both in the Supabase SQL editor, then restart the dev server.

## Data Flow
- GET `/api/scrape`: returns messy lines (pretend scraper)
- POST `/api/scrape`: parses lines, upserts `items` & `markets`, inserts into `prices`
- GET `/api/prices`: aggregates DB → avg price, cheapest market, short history
- GET `/api/items/[id]`: returns `{ source, history: [{ date, price, market }] }` with mock fallback

## Key Pages
- `/` Dashboard
- `/items/[id]` Item detail (client fetch to `/api/items/[id]`)
- `/markets` Markets list
- `/about` About

## Useful Commands
Seed via mock scrape:
```bash
curl -X POST http://localhost:3000/api/scrape
```
Inspect data:
```bash
curl http://localhost:3000/api/prices
curl http://localhost:3000/api/items/rice_50kg
```

## Troubleshooting
- 500 errors from API → check `.env.local` or rely on mock fallback
- On Windows, if PowerShell blocks npm/npx → use cmd.exe

## License
MIT
![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Styled%20with-TailwindCSS-38bdf8?logo=tailwindcss)
