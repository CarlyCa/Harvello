create extension if not exists pgcrypto;

create table if not exists civic_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text,
  department text,
  notes text,
  role text not null default 'Hive Ambassador'
    check (role in ('Administrator', 'Employee', 'Hive Ambassador', 'Reviewer', 'Opportunity Coordinator', 'Team Lead')),
  active boolean not null default false,
  source text not null default 'app' check (source in ('app', 'workbook', 'auth')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is null or email = lower(email))
);

create unique index if not exists civic_accounts_email_unique
  on civic_accounts (lower(email)) where email is not null;
create unique index if not exists civic_accounts_name_department_unique
  on civic_accounts (lower(name), coalesce(department, ''));
create index if not exists civic_accounts_department_idx on civic_accounts (department);

create table if not exists civic_content (
  content_key text primary key,
  value jsonb not null,
  updated_by uuid references civic_accounts(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists civic_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  submitted_by uuid references civic_accounts(id) on delete set null,
  status text not null default 'pending_approval'
    check (status in ('pending_approval', 'published', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists civic_opportunity_approvals (
  opportunity_id uuid not null references civic_opportunities(id) on delete cascade,
  approver_key text not null check (approver_key in ('whitney', 'lily')),
  approved_by uuid not null references civic_accounts(id) on delete restrict,
  approved_at timestamptz not null default now(),
  primary key (opportunity_id, approver_key)
);

create table if not exists civic_registrations (
  opportunity_id uuid not null references civic_opportunities(id) on delete cascade,
  account_id uuid not null references civic_accounts(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'cancelled')),
  registered_at timestamptz not null default now(),
  primary key (opportunity_id, account_id)
);

create table if not exists civic_engagement_requests (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  organization text not null,
  event_at timestamptz not null,
  contact_name text,
  audience text,
  description text not null default '',
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'approved', 'declined')),
  assigned_to uuid references civic_accounts(id) on delete set null,
  submitted_by uuid references civic_accounts(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists civic_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references civic_accounts(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Civic Circle reads and writes through server-side routes using the service
-- role. Supabase Auth sessions are verified by those routes; direct table access
-- remains closed.
alter table civic_accounts enable row level security;
alter table civic_content enable row level security;
alter table civic_opportunities enable row level security;
alter table civic_opportunity_approvals enable row level security;
alter table civic_registrations enable row level security;
alter table civic_engagement_requests enable row level security;
alter table civic_audit_log enable row level security;

insert into civic_accounts (name, email, department, notes, role, active, source) values
  ('Carly Callans', 'ccallans@hornets.com', null, null, 'Administrator', true, 'app'),
  ('Donna Julian', null, 'Arena', null, 'Hive Ambassador', false, 'workbook'),
  ('Dan Bain', null, 'Arena', null, 'Hive Ambassador', false, 'workbook'),
  ('Steven Antoine', null, 'Arena', null, 'Hive Ambassador', false, 'workbook'),
  ('Kevin Gober', null, 'Arena', null, 'Hive Ambassador', false, 'workbook'),
  ('Michele Crawford', null, 'Arena', null, 'Hive Ambassador', false, 'workbook'),
  ('Alex Mackenzie', null, 'Arena', null, 'Hive Ambassador', false, 'workbook'),
  ('Betsy Mack', null, 'CIF', null, 'Hive Ambassador', false, 'workbook'),
  ('Whitney Tarver', 'wtarver@hornets.com', 'CIF', null, 'Administrator', true, 'workbook'),
  ('Lily Commander', 'lcommander@hornets.com', 'CIF', null, 'Administrator', true, 'workbook'),
  ('Mike Cristaldi', null, 'Comms', null, 'Hive Ambassador', false, 'workbook'),
  ('Brian Travis', null, 'Comms', null, 'Hive Ambassador', false, 'workbook'),
  ('Shelly Cayette-Weston', null, 'Executive', null, 'Hive Ambassador', false, 'workbook'),
  ('Travis Ferguson', null, 'Finance', null, 'Hive Ambassador', false, 'workbook'),
  ('Shannon Gillian', null, 'Finance', null, 'Hive Ambassador', false, 'workbook'),
  ('Jim Dunlevy', null, 'Finance', 'Auditors/accountants', 'Hive Ambassador', false, 'workbook'),
  ('Graham Pitt', null, 'Finance', 'Finance Students', 'Hive Ambassador', false, 'workbook'),
  ('Ronnie Bryant', null, 'IT', null, 'Hive Ambassador', false, 'workbook'),
  ('Katie Murphy', null, 'IT', null, 'Hive Ambassador', false, 'workbook'),
  ('Liz Rackoff', null, 'Marketing', null, 'Hive Ambassador', false, 'workbook'),
  ('Tyrel Kirkham', null, 'Marketing', null, 'Hive Ambassador', false, 'workbook'),
  ('Jason Simon', null, 'Marketing', null, 'Hive Ambassador', false, 'workbook'),
  ('Joe (New VP, Brand)', null, 'Marketing', null, 'Hive Ambassador', false, 'workbook'),
  ('Leslie Fitch', null, 'Revenue', null, 'Hive Ambassador', false, 'workbook'),
  ('Mike Behan', null, 'Revenue', null, 'Hive Ambassador', false, 'workbook'),
  ('Alena Jasinski', null, 'Revenue', null, 'Hive Ambassador', false, 'workbook'),
  ('Andy Bradshaw', null, 'Revenue', null, 'Hive Ambassador', false, 'workbook'),
  ('Jon Delord', null, 'Revenue', null, 'Hive Ambassador', false, 'workbook'),
  ('Steve Swetoha', null, 'Swarm', null, 'Hive Ambassador', false, 'workbook')
on conflict do nothing;

insert into civic_content (content_key, value) values
  ('dashboard', '{"greeting":"Good afternoon, Carly","introduction":"Your speaking engagements, board service, volunteering and training in one place — plus what needs your attention this week.","actions":[{"title":"Submit a speaking request","description":"Request a Hive Ambassador for an event"},{"title":"Find a volunteer opportunity","description":"Browse, filter and register"},{"title":"Nominate a nonprofit","description":"$1,000 quarterly award"}],"upcomingHeading":"My upcoming activities","tasksHeading":"Tasks requiring my attention"}'::jsonb)
on conflict (content_key) do nothing;

create or replace function publish_fully_approved_opportunity()
returns trigger language plpgsql as $$
begin
  if (select count(distinct approver_key) from civic_opportunity_approvals where opportunity_id = new.opportunity_id) = 2 then
    update civic_opportunities set status = 'published', updated_at = now() where id = new.opportunity_id;
  end if;
  return new;
end;
$$;

drop trigger if exists civic_publish_after_approval on civic_opportunity_approvals;
create trigger civic_publish_after_approval
after insert or update on civic_opportunity_approvals
for each row execute function publish_fully_approved_opportunity();

create or replace function validate_civic_opportunity_approver()
returns trigger language plpgsql as $$
declare approver_email text;
begin
  select email into approver_email from civic_accounts where id = new.approved_by and active = true;
  if (new.approver_key = 'whitney' and approver_email is distinct from 'wtarver@hornets.com')
    or (new.approver_key = 'lily' and approver_email is distinct from 'lcommander@hornets.com') then
    raise exception 'The approval identity does not match the required approver.';
  end if;
  return new;
end;
$$;

drop trigger if exists civic_validate_approver on civic_opportunity_approvals;
create trigger civic_validate_approver
before insert or update on civic_opportunity_approvals
for each row execute function validate_civic_opportunity_approver();
