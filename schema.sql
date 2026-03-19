-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- Perfiles de usuario (extiende auth.users de Supabase)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  role text check (role in ('admin','operator','viewer')) default 'operator',
  is_active boolean default true,
  last_seen_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Log de accesos
create table auth_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  event text not null, -- login_success, login_failed, logout
  ip_address text,
  user_agent text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Instancias de WhatsApp (Evolution API)
create table whatsapp_instances (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  instance_name text unique not null,
  display_name text,
  phone_number text,
  status text default 'disconnected',
  evolution_url text,
  api_key_encrypted text,
  last_connected_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Contactos
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  phone text not null,
  company text,
  city text,
  email text,
  tags text[] default '{}',
  custom_fields jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique(user_id, phone)
);

-- Grupos
create table contact_groups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  color text default '#25D366',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table contact_group_members (
  contact_id uuid references contacts(id) on delete cascade,
  group_id uuid references contact_groups(id) on delete cascade,
  primary key (contact_id, group_id)
);

-- Plantillas de mensaje
create table message_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  content text not null,
  has_attachment boolean default false,
  attachment_type text,
  attachment_url text,
  ai_tone text,
  ai_context text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Campañas
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  instance_id uuid references whatsapp_instances(id) on delete restrict,
  name text not null,
  description text,
  template_message text not null,
  attachment_type text,
  attachment_url text,
  ai_enabled boolean default false,
  ai_tone text,
  ai_context text,
  schedule_type text default 'immediate',
  scheduled_at timestamptz,
  status text default 'draft',
  delay_min integer default 45,
  delay_max integer default 90,
  pause_every_n integer default 25,
  pause_duration_min integer default 180,
  pause_duration_max integer default 480,
  daily_limit integer default 150,
  allowed_start_hour integer default 8,
  allowed_end_hour integer default 19,
  total_contacts integer default 0,
  sent_count integer default 0,
  failed_count integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Cola de mensajes
create table message_queue (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete restrict not null,
  personalized_message text,
  status text default 'pending',
  attempts integer default 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  error_message text,
  evolution_message_id text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Logs de mensajes
create table message_logs (
  id uuid primary key default uuid_generate_v4(),
  message_queue_id uuid references message_queue(id) on delete cascade not null,
  event_type text not null,
  evolution_response jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Reportes
create table campaign_reports (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  report_name text not null,
  summary jsonb not null,
  is_public boolean default false,
  public_token text unique,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Logs de webhooks recibidos
create table webhook_logs (
  id uuid primary key default uuid_generate_v4(),
  instance_id uuid references whatsapp_instances(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  processed boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Configuración general por usuario
create table user_settings (
  user_id uuid references profiles(id) on delete cascade primary key,
  business_name text,
  business_logo_url text,
  timezone text default 'America/Bogota',
  openai_api_key_encrypted text,
  gmaps_api_key_encrypted text,
  resend_api_key_encrypted text,
  notification_email text,
  external_webhook_url text,
  ai_default_context text,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- TRIGGERS POUR UPDATED_AT
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on profiles for each row execute function handle_updated_at();
create trigger update_whatsapp_instances_updated_at before update on whatsapp_instances for each row execute function handle_updated_at();
create trigger update_contacts_updated_at before update on contacts for each row execute function handle_updated_at();
create trigger update_contact_groups_updated_at before update on contact_groups for each row execute function handle_updated_at();
create trigger update_message_templates_updated_at before update on message_templates for each row execute function handle_updated_at();
create trigger update_campaigns_updated_at before update on campaigns for each row execute function handle_updated_at();
create trigger update_message_queue_updated_at before update on message_queue for each row execute function handle_updated_at();
create trigger update_user_settings_updated_at before update on user_settings for each row execute function handle_updated_at();

-- TRIGGER PARA CREAR PROFILE CUANDO USUARIO SE REGISTRA
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'operator');
  
  insert into public.user_settings (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Remove drop and create for simple execution without errors on first run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES

alter table profiles enable row level security;
alter table auth_logs enable row level security;
alter table whatsapp_instances enable row level security;
alter table contacts enable row level security;
alter table contact_groups enable row level security;
alter table contact_group_members enable row level security;
alter table message_templates enable row level security;
alter table campaigns enable row level security;
alter table message_queue enable row level security;
alter table message_logs enable row level security;
alter table campaign_reports enable row level security;
alter table webhook_logs enable row level security;
alter table user_settings enable row level security;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (is_admin());
create policy "Admins can update profiles" on profiles for update using (is_admin());
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own auth_logs" on auth_logs for select using (auth.uid() = user_id);
create policy "Admins can view all auth_logs" on auth_logs for select using (is_admin());
create policy "System can insert auth_logs" on auth_logs for insert with check (true);

create policy "Users manage own instances" on whatsapp_instances for all using (auth.uid() = user_id);
create policy "Admins manage all instances" on whatsapp_instances for all using (is_admin());

create policy "Users manage own contacts" on contacts for all using (auth.uid() = user_id);
create policy "Admins manage all contacts" on contacts for all using (is_admin());

create policy "Users manage own groups" on contact_groups for all using (auth.uid() = user_id);
create policy "Admins manage all groups" on contact_groups for all using (is_admin());

create policy "Users manage own group members" on contact_group_members for all using (
  exists (select 1 from contact_groups where id = group_id and user_id = auth.uid())
);
create policy "Admins manage all group members" on contact_group_members for all using (is_admin());

create policy "Users manage own templates" on message_templates for all using (auth.uid() = user_id);
create policy "Admins manage all templates" on message_templates for all using (is_admin());

create policy "Users manage own campaigns" on campaigns for all using (auth.uid() = user_id);
create policy "Admins manage all campaigns" on campaigns for all using (is_admin());

create policy "Users manage own message queue" on message_queue for all using (
  exists (select 1 from campaigns where id = campaign_id and user_id = auth.uid())
);
create policy "Admins manage all message queue" on message_queue for all using (is_admin());

create policy "Users view own message logs" on message_logs for select using (
  exists (select 1 from message_queue mq join campaigns c on mq.campaign_id = c.id where mq.id = message_queue_id and c.user_id = auth.uid())
);
create policy "Admins view all message logs" on message_logs for select using (is_admin());

create policy "Users manage own reports" on campaign_reports for all using (auth.uid() = user_id);
create policy "Admins manage all reports" on campaign_reports for all using (is_admin());
create policy "Public can view public reports" on campaign_reports for select using (is_public = true);

create policy "Users view own webhook logs" on webhook_logs for select using (
  exists (select 1 from whatsapp_instances where id = instance_id and user_id = auth.uid())
);
create policy "Admins view all webhook logs" on webhook_logs for select using (is_admin());

create policy "Users manage own settings" on user_settings for all using (auth.uid() = user_id);
create policy "Admins view all settings" on user_settings for select using (is_admin());

-- ÍNDICES (INDEXES) POR RENDIMIENTO
create index if not exists idx_contacts_user_id on contacts(user_id);
create index if not exists idx_campaigns_user_id on campaigns(user_id);
create index if not exists idx_message_queue_campaign_id on message_queue(campaign_id);
create index if not exists idx_message_queue_status on message_queue(status);
create index if not exists idx_webhook_logs_instance_id on webhook_logs(instance_id);

-- Storage buckets setup (If needed)
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false) on conflict do nothing;

create policy "Users can upload their own attachments" on storage.objects for insert with check ( bucket_id = 'attachments' and auth.uid() = owner );
create policy "Users can view their own attachments" on storage.objects for select using ( bucket_id = 'attachments' and auth.uid() = owner );
create policy "Tokens can access attachments if shared" on storage.objects for select using ( bucket_id = 'attachments' ); -- Ajustable luego según necesidad
