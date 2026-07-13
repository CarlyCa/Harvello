create extension if not exists vector;
create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  website_url text not null,
  status text not null default 'demo' check (status in ('demo', 'claimed', 'published', 'disabled')),
  owner_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  email text not null,
  role text not null default 'owner' check (role in ('owner', 'admin', 'viewer')),
  created_at timestamptz not null default now()
);

create table public.demos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  domain text not null,
  status text not null default 'pending' check (status in ('pending', 'crawling', 'processing', 'ready', 'failed', 'expired', 'claimed')),
  expires_at timestamptz not null default now() + interval '7 days',
  created_ip inet,
  error text,
  token_usage integer not null default 0,
  estimated_cost numeric(10, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  demo_id uuid references public.demos(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'queued',
  progress integer not null default 0,
  message text not null default 'Queued',
  pages_found integer not null default 0,
  pages_indexed integer not null default 0,
  pdfs_indexed integer not null default 0,
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  demo_id uuid references public.demos(id) on delete set null,
  url text not null,
  title text not null,
  description text,
  source_type text not null check (source_type in ('webpage', 'pdf', 'faq', 'upload')),
  status text not null default 'approved' check (status in ('pending', 'approved', 'excluded')),
  content_hash text,
  created_at timestamptz not null default now(),
  unique (organization_id, url)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536),
  token_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index chunks_embedding_idx on public.chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index chunks_org_idx on public.chunks (organization_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  demo_id uuid references public.demos(id) on delete set null,
  session_id text,
  mode text not null default 'demo' check (mode in ('demo', 'hosted', 'widget', 'admin_test')),
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  confidence numeric(4, 3),
  token_usage integer not null default 0,
  estimated_cost numeric(10, 4) not null default 0,
  created_at timestamptz not null default now()
);

create table public.escalations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  email text,
  question text not null,
  status text not null default 'open' check (status in ('open', 'sent', 'closed')),
  created_at timestamptz not null default now()
);

create table public.widget_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  assistant_name text not null default 'Resident Assistant',
  accent_color text not null default '#2f6f5e',
  greeting text not null default 'Hi, how can I help today?',
  suggested_prompts text[] not null default '{}',
  position text not null default 'right' check (position in ('left', 'right')),
  fallback_message text not null default 'I could not find a reliable answer in the approved sources.',
  confidence_threshold numeric(4, 3) not null default 0.55,
  escalation_email text,
  enabled_languages text[] not null default array['en'],
  show_citations boolean not null default true,
  allowed_domains text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.demos enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.sources enable row level security;
alter table public.documents enable row level security;
alter table public.chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.escalations enable row level security;
alter table public.widget_settings enable row level security;

create policy "members can read their organization"
  on public.organizations for select
  using (id in (select organization_id from public.users where users.id = auth.uid()));

create policy "members can read scoped data"
  on public.sources for select
  using (organization_id in (select organization_id from public.users where users.id = auth.uid()));

create policy "members can manage widget settings"
  on public.widget_settings for all
  using (organization_id in (select organization_id from public.users where users.id = auth.uid()))
  with check (organization_id in (select organization_id from public.users where users.id = auth.uid()));

create policy "members can read documents"
  on public.documents for select
  using (organization_id in (select organization_id from public.users where users.id = auth.uid()));

create policy "members can read conversations"
  on public.conversations for select
  using (organization_id in (select organization_id from public.users where users.id = auth.uid()));

create or replace function public.match_chunks(
  query_embedding vector(1536),
  match_organization_id uuid,
  match_count int default 6
)
returns table (
  id uuid,
  source_id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select chunks.id, chunks.source_id, chunks.content, 1 - (chunks.embedding <=> query_embedding) as similarity
  from public.chunks
  where chunks.organization_id = match_organization_id
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
