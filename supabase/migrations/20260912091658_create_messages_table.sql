-- Stores every Messenger event the webhook receives (messages, postbacks, referrals).
-- meta_message_id is unique so Meta's retried/duplicate deliveries get ignored on insert.
create table if not exists messages (
  id bigint generated always as identity primary key,
  meta_message_id text unique not null,
  page_id text not null,
  sender_id text not null,
  message_text text,
  event_type text not null,
  created_at timestamptz not null default now()
);
