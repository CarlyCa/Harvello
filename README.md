# Harvello

Self-serve SaaS MVP for park districts: enter a public website, generate a temporary AI Digital Front Desk, test it, then claim and customize it.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app works in a local fallback mode without Supabase or OpenAI. Without Supabase, generated bots are saved to `.data/demos.json`. With Supabase configured, generated bots, widget settings, sources, chunks, and hardcoded answers are persisted in Supabase.

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL` defaults to `gpt-5.6-terra`; set it to `gpt-5.6` for the strongest model if your account has access.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Database

Apply `supabase/schema.sql` to a Supabase project with pgvector enabled.

For the current MVP, the app writes complete bot records to `public.harvello_demos` as JSONB. The older normalized tables are kept for future expansion, but `harvello_demos` is the production persistence path used by the app today.
