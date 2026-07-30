alter table public.conversation_participants
  add column if not exists left_at timestamptz;

create index if not exists conversation_participants_active_user_idx
  on public.conversation_participants(user_id)
  where left_at is null;

create or replace function public.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = target_conversation_id
      and user_id = auth.uid()
      and left_at is null
  );
$$;
