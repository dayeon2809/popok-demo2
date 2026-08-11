-- Minimal 1:1 messaging for newly-created portfolio requests.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  portfolio_request_id uuid not null,
  portfolio_request_type text not null check (portfolio_request_type in ('artist', 'company')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (portfolio_request_type, portfolio_request_id)
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  message_type text not null check (message_type in ('user', 'system')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (
    (message_type = 'system' and sender_id is null)
    or (message_type = 'user' and sender_id is not null)
  )
);

create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at);
create index if not exists conversation_participants_user_idx
  on public.conversation_participants(user_id);
create index if not exists conversations_last_message_idx
  on public.conversations(last_message_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = target_conversation_id and user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
grant execute on function public.is_conversation_participant(uuid) to authenticated;

create policy "Participants can view conversations"
  on public.conversations for select to authenticated
  using (public.is_conversation_participant(id));
create policy "Participants can view participants"
  on public.conversation_participants for select to authenticated
  using (public.is_conversation_participant(conversation_id));
create policy "Participants can update their read marker"
  on public.conversation_participants for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "Participants can view messages"
  on public.messages for select to authenticated
  using (public.is_conversation_participant(conversation_id));
create policy "Participants can send messages"
  on public.messages for insert to authenticated
  with check (
    message_type = 'user'
    and sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

-- Called only by the service-role API after it has verified both accounts.
create or replace function public.create_portfolio_conversation(
  request_id uuid,
  request_type text,
  sender_user_id uuid,
  recipient_user_id uuid,
  first_message text,
  first_message_is_system boolean
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_uuid uuid;
begin
  if request_type not in ('artist', 'company')
     or sender_user_id = recipient_user_id
     or nullif(btrim(first_message), '') is null then
    raise exception 'invalid conversation arguments';
  end if;

  insert into public.conversations(portfolio_request_id, portfolio_request_type)
  values (request_id, request_type)
  on conflict (portfolio_request_type, portfolio_request_id)
  do update set portfolio_request_id = excluded.portfolio_request_id
  returning id into conversation_uuid;

  insert into public.conversation_participants(conversation_id, user_id)
  values (conversation_uuid, sender_user_id), (conversation_uuid, recipient_user_id)
  on conflict do nothing;

  if not exists (select 1 from public.messages where conversation_id = conversation_uuid) then
    insert into public.messages(conversation_id, sender_id, message_type, body)
    values (
      conversation_uuid,
      case when first_message_is_system then null else sender_user_id end,
      case when first_message_is_system then 'system' else 'user' end,
      left(btrim(first_message), 2000)
    );
  end if;

  return conversation_uuid;
end;
$$;

revoke all on function public.create_portfolio_conversation(uuid, text, uuid, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.create_portfolio_conversation(uuid, text, uuid, uuid, text, boolean) to service_role;

create or replace function public.touch_conversation_after_message()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at, updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_after_message();
