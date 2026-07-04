-- ============================================================
-- Parche Fase 8 — revisión de seguridad y casos borde
-- Correr una sola vez sobre la base ya provisionada.
-- ============================================================

-- 1) Bloquea que un cliente cambie su propio email vía la API
--    (además del rol, que ya estaba bloqueado desde la Fase 1)
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

-- 2) Evita que dos citas activas caigan en el mismo día+hora exactos
--    si alguien intenta reservar directo contra la API
create unique index if not exists appointments_no_double_booking_idx
  on public.appointments (date, time)
  where status in ('pending_payment', 'pending_validation', 'confirmed');

-- 3) Server-side: el precio/duración/nombre del servicio se toman
--    SIEMPRE de la tabla services al crear la cita, ignorando lo que
--    mande el cliente — cierra la posibilidad de manipular el precio
--    llamando a la API directo en vez de usar la UI.
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

-- 4) Ya no se puede reservar una fecha pasada
drop policy if exists "appointments_insert_own" on public.appointments;
create policy "appointments_insert_own"
  on public.appointments for insert
  with check (auth.uid() = client_id and status = 'pending_payment' and date >= current_date);

-- 5) Faltaban políticas de UPDATE en los buckets privados: el upload
--    usa upsert=true, que internamente necesita permiso de UPDATE
--    (no solo INSERT) cuando el archivo ya existe (ej. reintentos).
drop policy if exists "reference_photos_update_own" on storage.objects;
create policy "reference_photos_update_own"
  on storage.objects for update
  using (bucket_id = 'reference-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "payment_proofs_update_own" on storage.objects;
create policy "payment_proofs_update_own"
  on storage.objects for update
  using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

-- 6) Las RPC de horarios y teléfono de la dueña no necesitan ser
--    públicas (anon): las únicas pantallas que las llaman ya exigen
--    login. Menos superficie expuesta.
revoke execute on function public.get_booked_slots(date) from anon;
revoke execute on function public.get_admin_phone() from anon;
