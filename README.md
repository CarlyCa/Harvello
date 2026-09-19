# Harvello

Self-serve SaaS MVP for any organization: enter a public website, generate a temporary AI Digital Front Desk, test it, then claim and customize it.

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
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `ADMIN_PASSWORD` protects `/admin`, `/dashboard`, and dashboard setup saves. Username is `admin`.

## Database

Apply `supabase/schema.sql` to a Supabase project with pgvector enabled.

For the current MVP, the app writes complete bot records to `public.harvello_demos` as JSONB. The older normalized tables are kept for future expansion, but `harvello_demos` is the production persistence path used by the app today.

### Civic Circle database

1. Create a free Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Paste and run `supabase/civic-schema.sql`. It creates the Civic Circle tables, imports the Hive Ambassadors workbook roster, enables row-level security, and installs the two-approver publishing trigger.
4. Copy the project URL, publishable key, and secret key from **Project Settings > API** into `.env.local` or the Render environment:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Keep `SUPABASE_SECRET_KEY` server-side. Never expose it in a `NEXT_PUBLIC_` variable or browser code. Legacy `anon` and `service_role` keys remain supported temporarily, but new Supabase projects should use publishable and secret keys.

After restarting the app, open `/api/civic/health`. A successful response reports `connected: true` and the imported account count.

If the database was created with the earlier Entra-ready schema, run `supabase/civic-auth-migration.sql` once. This replaces the unused Entra identifier with `auth_user_id` linked to Supabase Auth and hardens Whitney/Lily opportunity approvals.

### Civic Circle authentication and email

Civic Circle uses Supabase email/password authentication with cookie-based server sessions. In **Authentication > URL Configuration**, set:

```text
Site URL: https://civiccircle.onrender.com
Redirect URLs:
https://civiccircle.onrender.com/auth/confirm
http://localhost:3000/auth/confirm
```

Keep email confirmation enabled. A signed-in user only receives application access when their verified `@hornets.com` address matches an active record in `civic_accounts`. The first successful match links the immutable Supabase Auth user ID to that account. Every mutation re-reads the current account role from the database.

Configure **Authentication > Emails > SMTP Settings** with the SMTP credentials approved by Hornets IT:

```text
Sender name: Community Impact | Civic Circle
Sender email: communityimpact@hornets.com
```

The mailbox password or SMTP credential belongs only in Supabase's SMTP settings—not Render, `.env`, or GitHub. Customize the confirmation and password-recovery templates in **Authentication > Emails > Templates**. For production, enable CAPTCHA and review Supabase Auth rate limits.
