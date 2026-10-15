-- Portal de noticias Índice Agro: esquema para recibir el webhook de Hancel.
-- Todo el acceso pasa por el servidor de Next.js con la clave secreta (service_role);
-- RLS queda activo sin políticas, así que la clave pública no puede leer ni escribir nada.

-- ───────────────────────── Temas (nichos del motor) ─────────────────────────
create table if not exists public.temas (
  slug           text primary key,
  nombre         text not null,
  orden          integer not null default 100,
  creado_at      timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

insert into public.temas (slug, nombre, orden) values
  ('cultivos-principales',                'Cultivos principales',                1),
  ('frutas-y-exportacion-no-tradicional', 'Frutas y exportación no tradicional', 2),
  ('ganaderia-y-pecuario',                'Ganadería y pecuario',                3),
  ('sanidad-y-plagas',                    'Sanidad y plagas',                    4),
  ('clima-y-agua',                        'Clima y agua',                        5),
  ('insumos-y-maquinaria',                'Insumos y maquinaria',                6),
  ('politica-y-mercado',                  'Política y mercado',                  7),
  ('agtech-e-innovacion',                 'Agtech e innovación',                 8),
  ('sostenibilidad-y-ambiente',           'Sostenibilidad y ambiente',           9),
  ('gremios-y-ruralidad',                 'Gremios y ruralidad',                 10)
on conflict (slug) do nothing;

-- ───────────────────────── Noticias ─────────────────────────
create table if not exists public.noticias (
  id                uuid primary key,                       -- noticia.id del motor, nunca cambia
  numero            bigint generated always as identity unique, -- id_externo que se devuelve al motor
  version           integer not null,
  slug              text not null unique,                   -- fijo desde el primer envío
  estado            text not null default 'publicada' check (estado in ('publicada', 'retirada')),
  empresa_slug      text,
  idioma            text not null default 'es-CO',
  titular           text not null,
  resumen           text,
  tema_slug         text references public.temas (slug) on update cascade,
  etiquetas         text[] not null default '{}',
  imagen_url        text,                                   -- URL del storage del motor
  imagen_url_propia text,                                   -- copia en el storage del portal
  imagen_ancho      integer,
  imagen_alto       integer,
  imagen_alt        text,
  fuentes_total     integer not null default 0,
  fuentes_dominios  text[] not null default '{}',           -- para los favicons de las tarjetas
  palabras          integer,
  minutos_lectura   integer,
  redactada_at      timestamptz,
  publicada_at      timestamptz not null,
  actualizada_at    timestamptz not null default now(),
  retirada_at       timestamptz,
  motivo_retiro     text,
  vistas            bigint not null default 0,
  datos             jsonb not null,                         -- el bloque noticia completo, tal cual llegó
  creado_at         timestamptz not null default now()
);

create index if not exists noticias_estado_fecha_idx on public.noticias (estado, publicada_at desc);
create index if not exists noticias_tema_fecha_idx on public.noticias (tema_slug, estado, publicada_at desc);

-- ───────────────────────── Vistas por día (para Destacados) ─────────────────────────
create table if not exists public.noticia_vistas_diarias (
  noticia_id uuid not null references public.noticias (id) on delete cascade,
  dia        date not null default current_date,
  vistas     integer not null default 0,
  primary key (noticia_id, dia)
);

create index if not exists noticia_vistas_dia_idx on public.noticia_vistas_diarias (dia);

-- ───────────────────────── Registro de eventos del webhook ─────────────────────────
create table if not exists public.webhook_eventos (
  id              text primary key,          -- evento.id (igual en todos los reintentos)
  tipo            text not null,
  noticia_id      uuid,
  noticia_version integer,
  intento         integer,
  resultado       text not null,             -- creada, actualizada, retirada, ignorada_version, error...
  error           text,
  recibido_at     timestamptz not null default now(),
  procesado_at    timestamptz
);

create index if not exists webhook_eventos_recibido_idx on public.webhook_eventos (recibido_at desc);

alter table public.temas                  enable row level security;
alter table public.noticias               enable row level security;
alter table public.noticia_vistas_diarias enable row level security;
alter table public.webhook_eventos        enable row level security;

-- ───────────────────────── Funciones ─────────────────────────

-- Crea o actualiza una noticia de forma atómica. Ignora versiones menores o iguales
-- a la guardada y conserva el slug del primer envío.
create or replace function public.upsert_noticia(p_empresa_slug text, p_noticia jsonb)
returns table (resultado text, numero bigint, slug text, tema_slug text)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_id       uuid := (p_noticia ->> 'id')::uuid;
  v_version   integer := (p_noticia ->> 'version')::integer;
  v_tema      text := p_noticia -> 'nicho' ->> 'slug';
  v_tema_nom  text := p_noticia -> 'nicho' ->> 'nombre';
  v_actual    public.noticias%rowtype;
  v_dominios  text[];
begin
  if v_tema is not null then
    insert into public.temas as t (slug, nombre)
    values (v_tema, coalesce(v_tema_nom, v_tema))
    on conflict on constraint temas_pkey do update
      set nombre = excluded.nombre, actualizado_at = now()
      where t.nombre is distinct from excluded.nombre;
  end if;

  -- Dominios de las fuentes, la principal primero, sin repetir.
  select coalesce(array_agg(d order by orden), '{}') into v_dominios
  from (
    select distinct on (d) d, orden
    from (
      select lower(regexp_replace(substring(f ->> 'url' from '^https?://([^/:?#]+)'), '^www\.', '')) as d,
             case when (f ->> 'principal')::boolean then 0 else 1 end * 1000 + ord::integer as orden
      from jsonb_array_elements(coalesce(p_noticia -> 'fuentes', '[]'::jsonb)) with ordinality as x (f, ord)
    ) s
    where d is not null
    order by d, orden
  ) u;

  select * into v_actual from public.noticias n where n.id = v_id for update;

  if found then
    if v_version <= v_actual.version then
      return query select 'ignorada_version'::text, v_actual.numero, v_actual.slug, v_actual.tema_slug;
      return;
    end if;

    update public.noticias n set
      version          = v_version,
      estado           = 'publicada',
      empresa_slug     = p_empresa_slug,
      idioma           = coalesce(p_noticia ->> 'idioma', 'es-CO'),
      titular          = p_noticia ->> 'titular',
      resumen          = p_noticia ->> 'resumen',
      tema_slug        = v_tema,
      etiquetas        = coalesce(array(select jsonb_array_elements_text(p_noticia -> 'etiquetas')), '{}'),
      imagen_url       = p_noticia -> 'imagen' ->> 'url',
      imagen_url_propia = case when p_noticia -> 'imagen' ->> 'url' is distinct from v_actual.imagen_url
                               then null else v_actual.imagen_url_propia end,
      imagen_ancho     = (p_noticia -> 'imagen' ->> 'ancho')::integer,
      imagen_alto      = (p_noticia -> 'imagen' ->> 'alto')::integer,
      imagen_alt       = p_noticia -> 'imagen' ->> 'alt',
      fuentes_total    = jsonb_array_length(coalesce(p_noticia -> 'fuentes', '[]'::jsonb)),
      fuentes_dominios = v_dominios,
      palabras         = (p_noticia ->> 'palabras')::integer,
      minutos_lectura  = (p_noticia ->> 'minutos_lectura')::integer,
      redactada_at     = (p_noticia ->> 'redactada_at')::timestamptz,
      publicada_at     = coalesce((p_noticia ->> 'publicada_at')::timestamptz, v_actual.publicada_at),
      actualizada_at   = now(),
      retirada_at      = null,
      motivo_retiro    = null,
      datos            = p_noticia || jsonb_build_object('slug', v_actual.slug)
    where n.id = v_id;

    return query select 'actualizada'::text, v_actual.numero, v_actual.slug, v_tema;
    return;
  end if;

  insert into public.noticias as n (
    id, version, slug, estado, empresa_slug, idioma, titular, resumen, tema_slug, etiquetas,
    imagen_url, imagen_ancho, imagen_alto, imagen_alt, fuentes_total, fuentes_dominios,
    palabras, minutos_lectura, redactada_at, publicada_at, datos
  ) values (
    v_id, v_version, p_noticia ->> 'slug', 'publicada', p_empresa_slug,
    coalesce(p_noticia ->> 'idioma', 'es-CO'), p_noticia ->> 'titular', p_noticia ->> 'resumen', v_tema,
    coalesce(array(select jsonb_array_elements_text(p_noticia -> 'etiquetas')), '{}'),
    p_noticia -> 'imagen' ->> 'url', (p_noticia -> 'imagen' ->> 'ancho')::integer,
    (p_noticia -> 'imagen' ->> 'alto')::integer, p_noticia -> 'imagen' ->> 'alt',
    jsonb_array_length(coalesce(p_noticia -> 'fuentes', '[]'::jsonb)), v_dominios,
    (p_noticia ->> 'palabras')::integer, (p_noticia ->> 'minutos_lectura')::integer,
    (p_noticia ->> 'redactada_at')::timestamptz,
    coalesce((p_noticia ->> 'publicada_at')::timestamptz, now()), p_noticia
  );

  return query select 'creada'::text, n.numero, n.slug, n.tema_slug from public.noticias n where n.id = v_id;
end;
$$;

-- Despublica una noticia. Ignora la retirada si trae una versión vieja.
create or replace function public.retirar_noticia(p_id uuid, p_version integer, p_motivo text)
returns table (resultado text, slug text, tema_slug text)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actual public.noticias%rowtype;
begin
  select * into v_actual from public.noticias n where n.id = p_id for update;
  if not found then
    return query select 'no_existe'::text, null::text, null::text;
    return;
  end if;
  if p_version is not null and p_version <= v_actual.version then
    return query select 'ignorada_version'::text, v_actual.slug, v_actual.tema_slug;
    return;
  end if;

  update public.noticias n set
    estado = 'retirada',
    version = coalesce(p_version, v_actual.version),
    retirada_at = now(),
    motivo_retiro = p_motivo,
    actualizada_at = now()
  where n.id = p_id;

  return query select 'retirada'::text, v_actual.slug, v_actual.tema_slug;
end;
$$;

-- Suma una vista al total y al día de hoy.
create or replace function public.registrar_vista(p_noticia_id uuid)
returns void
language sql
set search_path = ''
as $$
  with n as (
    update public.noticias set vistas = vistas + 1
    where id = p_noticia_id and estado = 'publicada'
    returning id
  )
  insert into public.noticia_vistas_diarias (noticia_id, dia, vistas)
  select id, current_date, 1 from n
  on conflict (noticia_id, dia) do update set vistas = public.noticia_vistas_diarias.vistas + 1;
$$;

-- Orden de Destacados: más vistas en los últimos p_dias primero; empate (o sin vistas) por fecha,
-- que es el mismo orden de "Para ti".
create or replace function public.ids_destacados(p_dias integer default 7, p_limite integer default 30, p_desde integer default 0)
returns table (id uuid, vistas bigint)
language sql
stable
set search_path = ''
as $$
  select n.id, coalesce(s.v, 0)::bigint
  from public.noticias n
  left join (
    select noticia_id, sum(vistas) as v
    from public.noticia_vistas_diarias
    where dia >= current_date - p_dias
    group by noticia_id
  ) s on s.noticia_id = n.id
  where n.estado = 'publicada'
  order by coalesce(s.v, 0) desc, n.publicada_at desc
  limit p_limite offset p_desde;
$$;

revoke all on function public.upsert_noticia(text, jsonb)          from public, anon, authenticated;
revoke all on function public.retirar_noticia(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.registrar_vista(uuid)                from public, anon, authenticated;
revoke all on function public.ids_destacados(integer, integer, integer) from public, anon, authenticated;
grant execute on function public.upsert_noticia(text, jsonb)          to service_role;
grant execute on function public.retirar_noticia(uuid, integer, text) to service_role;
grant execute on function public.registrar_vista(uuid)                to service_role;
grant execute on function public.ids_destacados(integer, integer, integer) to service_role;

-- ───────────────────────── Storage para las imágenes propias ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('noticias', 'noticias', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
