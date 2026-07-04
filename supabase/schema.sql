-- ============================================================
-- AuraNails — Esquema completo de Supabase (Fase 1)
-- ============================================================
-- Cómo usarlo: pegar este archivo completo en el SQL Editor de
-- Supabase (Dashboard → SQL Editor → New query) y ejecutarlo una
-- sola vez sobre un proyecto nuevo. Es re-ejecutable de forma
-- segura (usa "if not exists" / "drop ... if exists" antes de
-- crear políticas y triggers).
--
-- Decisiones de negocio aplicadas (ver NEGOCIO.md):
--   - Una sola dueña atendiendo (sin tabla de staff/profesionales).
--   - Pago manual: transferencia + comprobante + validación admin.
--   - Moneda: soles peruanos (PEN).
--   - Notas separadas: favoritos/alergias los edita la clienta en
--     su perfil; las notas privadas de la dueña viven aparte en
--     "client_notes" y la clienta nunca puede leerlas.
--   - Los íconos del catálogo se resuelven en el frontend con una
--     librería de íconos (no se guarda ningún emoji en la base).
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type user_role as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum (
    'pending_payment',
    'pending_validation',
    'confirmed',
    'completed',
    'cancelled',
    'no_show'
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- TABLA: profiles
-- Extiende auth.users. Se crea sola vía trigger al registrarse.
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  name text not null default '',
  phone text,
  email text not null,
  favorite_colors text,
  allergies text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de usuario (clienta o dueña). id = auth.users.id';
comment on column public.profiles.favorite_colors is 'Preferencia de la clienta, la edita ella misma desde su perfil.';
comment on column public.profiles.allergies is 'Preferencia de la clienta, la edita ella misma desde su perfil.';

-- Crea el profile automáticamente al registrarse en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    'client'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Evita que una clienta se autoasigne el rol admin, o cambie su propio
-- email, DESDE LA APP. auth.uid() es NULL cuando la query corre fuera
-- del contexto de la API (SQL Editor, service_role, migraciones) — ese
-- camino queda permitido a propósito (promover admins a mano).
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role <> old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'No podés cambiar tu propio rol.';
  end if;
  if new.email <> old.email and auth.uid() is not null and not public.is_admin() then
    raise exception 'No podés cambiar tu correo desde acá.';
  end if;
  return new;
end;
$$;

-- ============================================================
-- TABLA: client_notes
-- Notas privadas de la dueña sobre una clienta. NUNCA visibles
-- para la clienta (separadas de favorite_colors/allergies).
-- ============================================================
create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.profiles(id) on delete cascade,
  note text not null default '',
  updated_at timestamptz not null default now()
);

comment on table public.client_notes is 'Notas privadas del CRM, solo legibles/editables por la dueña.';

-- ============================================================
-- TABLA: services (catálogo)
-- El ícono visual de cada servicio se resuelve en el frontend
-- (librería de íconos), no se persiste en la base.
-- ============================================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10,2) not null check (price >= 0),
  color text,
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.services is 'Catálogo de servicios del salón. Precio en soles (PEN).';

-- ============================================================
-- TABLA: schedule_days (disponibilidad por día concreto)
-- ============================================================
create table if not exists public.schedule_days (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  enabled boolean not null default false,
  start_time time,
  end_time time,
  updated_at timestamptz not null default now(),
  constraint schedule_time_range check (
    not enabled or (start_time is not null and end_time is not null and start_time < end_time)
  )
);

comment on table public.schedule_days is 'Horario de atención de la dueña para una fecha concreta.';

-- ============================================================
-- TABLA: schedule_breaks (descansos dentro de un día)
-- ============================================================
create table if not exists public.schedule_breaks (
  id uuid primary key default gen_random_uuid(),
  schedule_day_id uuid not null references public.schedule_days(id) on delete cascade,
  break_start time not null,
  break_end time not null,
  constraint break_time_range check (break_start < break_end)
);

comment on table public.schedule_breaks is 'Bloqueos/descansos (ej. almuerzo) dentro de un día habilitado.';

create index if not exists schedule_breaks_day_idx on public.schedule_breaks(schedule_day_id);

-- ============================================================
-- TABLA: appointments (citas)
-- ============================================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  -- snapshot del servicio al reservar: si el catálogo cambia después,
  -- la cita histórica conserva el precio/nombre/duración originales.
  service_name text not null,
  service_price numeric(10,2) not null,
  service_duration integer not null,
  date date not null,
  time time not null,
  status appointment_status not null default 'pending_payment',
  reference_photos text[] not null default '{}',
  payment_proof_url text,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.appointments is 'Citas reservadas por las clientas.';

create index if not exists appointments_client_id_idx on public.appointments(client_id);
create index if not exists appointments_date_idx on public.appointments(date);
create index if not exists appointments_status_idx on public.appointments(status);

-- Evita que dos citas activas ocupen exactamente el mismo día+hora,
-- por si alguien intenta reservar directo contra la API sin pasar
-- por el chequeo de horarios disponibles del frontend.
create unique index if not exists appointments_no_double_booking_idx
  on public.appointments (date, time)
  where status in ('pending_payment', 'pending_validation', 'confirmed');

-- Sobreescribe service_name/price/duration desde la tabla services al
-- crear la cita, ignorando lo que mande el cliente en el insert — evita
-- que alguien reserve manipulando el precio/duración desde la API.
create or replace function public.snapshot_service_details()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.service_id is not null then
    select name, price, duration_minutes
    into new.service_name, new.service_price, new.service_duration
    from public.services
    where id = new.service_id;

    if not found then
      raise exception 'El servicio seleccionado no existe.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists snapshot_service_details_trigger on public.appointments;
create trigger snapshot_service_details_trigger
  before insert on public.appointments
  for each row execute function public.snapshot_service_details();

-- ============================================================
-- Trigger genérico: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists prevent_role_self_escalation_trigger on public.profiles;
create trigger prevent_role_self_escalation_trigger
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

drop trigger if exists set_updated_at on public.client_notes;
create trigger set_updated_at before update on public.client_notes
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.services;
create trigger set_updated_at before update on public.services
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.schedule_days;
create trigger set_updated_at before update on public.schedule_days
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.appointments;
create trigger set_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();

-- ============================================================
-- Helper: ¿el usuario autenticado es admin?
-- security definer para poder consultar profiles sin recursión de RLS.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- RPC: la clienta sube su comprobante de pago
-- (evita darle permiso de UPDATE libre sobre appointments)
-- ============================================================
create or replace function public.submit_payment_proof(p_appointment_id uuid, p_proof_url text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.appointments
  set payment_proof_url = p_proof_url,
      status = 'pending_validation'
  where id = p_appointment_id
    and client_id = auth.uid()
    and status = 'pending_payment';

  if not found then
    raise exception 'No se pudo actualizar la cita (no existe, no es tuya, o no está pendiente de pago).';
  end if;
end;
$$;

grant execute on function public.submit_payment_proof(uuid, text) to authenticated;

-- ============================================================
-- RPC: horarios ocupados de una fecha (para el flujo de reserva)
-- El RLS de appointments solo deja ver las citas propias, así que
-- una clienta no vería las citas de otras y podría reservar un
-- horario ya tomado. Esta función expone SOLO el horario, no el
-- resto de los datos de la cita.
-- ============================================================
create or replace function public.get_booked_slots(p_date date)
returns table (slot_time time)
language sql
stable
security definer set search_path = public
as $$
  select time as slot_time from public.appointments
  where date = p_date and status in ('confirmed', 'pending_payment', 'pending_validation');
$$;

grant execute on function public.get_booked_slots(date) to authenticated;

-- ============================================================
-- RPC: teléfono de la dueña (para notificarle por WhatsApp)
-- El RLS de profiles solo deja ver el propio perfil, así que una
-- clienta no podría leer el teléfono de la admin directamente.
-- Expone SOLO el teléfono, nada más del perfil.
-- ============================================================
create or replace function public.get_admin_phone()
returns text
language sql
stable
security definer set search_path = public
as $$
  select phone from public.profiles where role = 'admin' limit 1;
$$;

grant execute on function public.get_admin_phone() to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.client_notes enable row level security;
alter table public.services enable row level security;
alter table public.schedule_days enable row level security;
alter table public.schedule_breaks enable row level security;
alter table public.appointments enable row level security;

-- ── profiles ─────────────────────────────────────────────────
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- ── client_notes (solo admin, nunca la clienta) ────────────────
drop policy if exists "client_notes_admin_only" on public.client_notes;
create policy "client_notes_admin_only"
  on public.client_notes for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── services ─────────────────────────────────────────────────
drop policy if exists "services_select_active_or_admin" on public.services;
create policy "services_select_active_or_admin"
  on public.services for select
  using (active or public.is_admin());

drop policy if exists "services_insert_admin" on public.services;
create policy "services_insert_admin"
  on public.services for insert
  with check (public.is_admin());

drop policy if exists "services_update_admin" on public.services;
create policy "services_update_admin"
  on public.services for update
  using (public.is_admin());

drop policy if exists "services_delete_admin" on public.services;
create policy "services_delete_admin"
  on public.services for delete
  using (public.is_admin());

-- ── schedule_days (lectura pública, escritura solo admin) ─────
drop policy if exists "schedule_days_select_all" on public.schedule_days;
create policy "schedule_days_select_all"
  on public.schedule_days for select
  using (true);

drop policy if exists "schedule_days_admin_write" on public.schedule_days;
create policy "schedule_days_admin_write"
  on public.schedule_days for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── schedule_breaks (idem) ─────────────────────────────────────
drop policy if exists "schedule_breaks_select_all" on public.schedule_breaks;
create policy "schedule_breaks_select_all"
  on public.schedule_breaks for select
  using (true);

drop policy if exists "schedule_breaks_admin_write" on public.schedule_breaks;
create policy "schedule_breaks_admin_write"
  on public.schedule_breaks for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── appointments ─────────────────────────────────────────────
drop policy if exists "appointments_select_own_or_admin" on public.appointments;
create policy "appointments_select_own_or_admin"
  on public.appointments for select
  using (auth.uid() = client_id or public.is_admin());

drop policy if exists "appointments_insert_own" on public.appointments;
create policy "appointments_insert_own"
  on public.appointments for insert
  with check (auth.uid() = client_id and status = 'pending_payment' and date >= current_date);

drop policy if exists "appointments_update_admin" on public.appointments;
create policy "appointments_update_admin"
  on public.appointments for update
  using (public.is_admin());

drop policy if exists "appointments_delete_admin" on public.appointments;
create policy "appointments_delete_admin"
  on public.appointments for delete
  using (public.is_admin());

-- ============================================================
-- STORAGE: buckets
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('catalog', 'catalog', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('reference-photos', 'reference-photos', false, 5242880, array['image/png','image/jpeg','image/webp']),
  ('payment-proofs', 'payment-proofs', false, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- ── catalog: lectura pública, escritura solo admin ────────────
-- ruta esperada: catalog/{service_id}.{ext}
drop policy if exists "catalog_select_public" on storage.objects;
create policy "catalog_select_public"
  on storage.objects for select
  using (bucket_id = 'catalog');

drop policy if exists "catalog_insert_admin" on storage.objects;
create policy "catalog_insert_admin"
  on storage.objects for insert
  with check (bucket_id = 'catalog' and public.is_admin());

drop policy if exists "catalog_update_admin" on storage.objects;
create policy "catalog_update_admin"
  on storage.objects for update
  using (bucket_id = 'catalog' and public.is_admin());

drop policy if exists "catalog_delete_admin" on storage.objects;
create policy "catalog_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'catalog' and public.is_admin());

-- ── reference-photos: privado por clienta ─────────────────────
-- ruta esperada: reference-photos/{client_id}/{appointment_id}/{n}.{ext}
drop policy if exists "reference_photos_insert_own" on storage.objects;
create policy "reference_photos_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'reference-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "reference_photos_update_own" on storage.objects;
create policy "reference_photos_update_own"
  on storage.objects for update
  using (
    bucket_id = 'reference-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "reference_photos_select_own_or_admin" on storage.objects;
create policy "reference_photos_select_own_or_admin"
  on storage.objects for select
  using (
    bucket_id = 'reference-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ── payment-proofs: privado por clienta ───────────────────────
-- ruta esperada: payment-proofs/{client_id}/{appointment_id}/proof.{ext}
drop policy if exists "payment_proofs_insert_own" on storage.objects;
create policy "payment_proofs_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment_proofs_update_own" on storage.objects;
create policy "payment_proofs_update_own"
  on storage.objects for update
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment_proofs_select_own_or_admin" on storage.objects;
create policy "payment_proofs_select_own_or_admin"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ============================================================
-- SEED: catálogo inicial
-- ⚠️ Los precios son placeholders en soles (PEN) — ajustalos a tu
-- realidad antes de ir a producción, no son una conversión real
-- de los montos que estaban en pesos colombianos.
-- ============================================================
insert into public.services (name, description, duration_minutes, price, color, sort_order)
values
  ('Esmaltado Permanente (Gel)', 'Esmalte de larga duración, brillo intenso hasta 3 semanas.', 60, 35.00, '#f472b6', 1),
  ('Rubber Base con Diseño', 'Base de goma flexible con diseño personalizado.', 90, 55.00, '#c084fc', 2),
  ('Acrílico Natural', 'Uñas de acrílico sin diseño, acabado natural o nude.', 120, 70.00, '#a78bfa', 3),
  ('Acrílico con Diseño', 'Uñas de acrílico con diseño personalizado (nail art).', 150, 90.00, '#818cf8', 4),
  ('Francés (French Manicure)', 'Clásico diseño francés en punta blanca con base nude.', 60, 45.00, '#e2e8f0', 5),
  ('Diseño Adicional (Nail Art)', 'Arte extra sobre cualquier servicio base.', 30, 20.00, '#fb7185', 6),
  ('Retiro de Acrílico', 'Remoción segura de uñas acrílicas.', 45, 25.00, '#6b7280', 7),
  ('Reparación de Uña', 'Reparación de una uña quebrada o dañada.', 20, 12.00, '#f59e0b', 8)
on conflict do nothing;
