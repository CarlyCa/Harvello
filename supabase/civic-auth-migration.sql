-- Run once in Supabase SQL Editor for databases created with the original
-- Entra-ready schema. New databases only need civic-schema.sql.
alter table civic_accounts add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
alter table civic_accounts drop column if exists entra_object_id;

alter table civic_accounts drop constraint if exists civic_accounts_source_check;
alter table civic_accounts add constraint civic_accounts_source_check
  check (source in ('app', 'workbook', 'auth'));

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
