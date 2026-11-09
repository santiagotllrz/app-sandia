-- ───────────────────────── Métricas propias del portal ─────────────────────────
--
-- Sin cookies ni terceros: el navegador guarda un id anónimo de visitante y de sesión (localStorage)
-- y manda cada página que abre y cuánto tiempo la tuvo a la vista. Hancel lee el resumen por día con
-- una petición firmada (/api/metricas/resumen); el portal no depende de Hancel para nada.

-- Una fila por página abierta. El id lo pone el navegador, así los envíos de tiempo actualizan la misma.
create table if not exists public.metricas_vistas (
  id             uuid primary key,
  creado_at      timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  visitante      uuid not null,
  sesion         uuid not null,
  nuevo          boolean not null default false,       -- primera página de ese visitante
  entrada        boolean not null default false,       -- primera página de la sesión
  tipo_pagina    text not null,                        -- noticia, enlaces, inicio, tema, destacados, otra
  ruta           text not null,
  noticia_id     uuid references public.noticias (id) on delete set null,
  canal          text not null,                        -- de dónde vino esta página
  canal_sesion   text not null,                        -- de dónde vino la sesión (su página de entrada)
  referente      text,                                 -- host del referente externo
  desde_enlaces  boolean not null default false,       -- llegó tocando una portada de /enlaces
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  dispositivo    text,                                 -- movil, tableta, escritorio
  pais           text,
  ciudad         text,
  segundos       integer not null default 0,           -- tiempo con la página a la vista y en uso
  scroll         smallint not null default 0           -- hasta dónde bajó, en %
);
create index if not exists metricas_vistas_creado_idx on public.metricas_vistas (creado_at);
create index if not exists metricas_vistas_noticia_idx on public.metricas_vistas (noticia_id, creado_at);

-- Clics que interesan: portadas de /enlaces, botón de alertas, compartir, fuentes.
create table if not exists public.metricas_clics (
  id         bigint generated always as identity primary key,
  creado_at  timestamptz not null default now(),
  visitante  uuid not null,
  sesion     uuid not null,
  vista_id   uuid,
  tipo       text not null,                            -- portada, alertas, compartir, fuente
  ruta       text,                                     -- dónde se hizo el clic
  noticia_id uuid references public.noticias (id) on delete set null,
  destino    text
);
create index if not exists metricas_clics_creado_idx on public.metricas_clics (creado_at);

alter table public.metricas_vistas enable row level security;
alter table public.metricas_clics  enable row level security;

-- El tiempo y el scroll solo crecen: un envío viejo que llegue tarde no los baja.
create or replace function public.metricas_tiempo(p_id uuid, p_segundos integer, p_scroll integer)
returns void
language sql
set search_path = ''
as $$
  update public.metricas_vistas
     set segundos = greatest(segundos, least(greatest(p_segundos, 0), 3600)),
         scroll = greatest(scroll, least(greatest(p_scroll, 0), 100)),
         actualizado_at = now()
   where id = p_id and creado_at > now() - interval '1 day';
$$;

-- El resumen que lee Hancel: días [p_desde, p_hasta] en la zona p_tz.
create or replace function public.metricas_resumen(p_desde date, p_hasta date, p_tz text default 'America/Bogota')
returns jsonb
language sql
stable
set search_path = ''
as $$
with v as (
  select mv.*, (mv.creado_at at time zone p_tz)::date as dia
    from public.metricas_vistas mv
   where mv.creado_at >= (p_desde::timestamp at time zone p_tz)
     and mv.creado_at <  ((p_hasta + 1)::timestamp at time zone p_tz)
),
c as (
  select mc.*, (mc.creado_at at time zone p_tz)::date as dia
    from public.metricas_clics mc
   where mc.creado_at >= (p_desde::timestamp at time zone p_tz)
     and mc.creado_at <  ((p_hasta + 1)::timestamp at time zone p_tz)
),
ses as (
  select dia, sesion, count(*) as paginas, max(canal_sesion) as canal from v group by dia, sesion
),
dias as (
  select d.dia,
    jsonb_build_object(
      'dia', d.dia,
      'visitantes', (select count(distinct visitante) from v where v.dia = d.dia),
      'nuevos', (select count(distinct visitante) from v where v.dia = d.dia and v.nuevo),
      'sesiones', (select count(*) from ses where ses.dia = d.dia),
      'vistas', (select count(*) from v where v.dia = d.dia),
      'rebote', (select coalesce(round(avg((paginas = 1)::int)::numeric, 4), 0) from ses where ses.dia = d.dia),
      'paginas_por_sesion', (select coalesce(round(avg(paginas)::numeric, 2), 0) from ses where ses.dia = d.dia),
      'segundos_lectura', (select coalesce(round(avg(segundos)), 0) from v where v.dia = d.dia and v.tipo_pagina = 'noticia' and v.segundos > 0),
      'canales', coalesce((
        select jsonb_object_agg(canal, jsonb_build_object('visitantes', vis, 'sesiones', s, 'vistas', vi))
          from (
            select ses.canal, count(distinct v.visitante) as vis, count(distinct ses.sesion) as s, count(v.id) as vi
              from ses join v on v.sesion = ses.sesion and v.dia = ses.dia
             where ses.dia = d.dia group by ses.canal
          ) x
      ), '{}'::jsonb),
      'dispositivos', coalesce((
        select jsonb_object_agg(coalesce(dispositivo, 'otro'), n)
          from (select dispositivo, count(distinct visitante) as n from v where v.dia = d.dia group by dispositivo) x
      ), '{}'::jsonb),
      'paises', coalesce((
        select jsonb_object_agg(coalesce(pais, '??'), n)
          from (select pais, count(distinct visitante) as n from v where v.dia = d.dia group by pais order by n desc limit 12) x
      ), '{}'::jsonb),
      'ciudades', coalesce((
        select jsonb_object_agg(ciudad, n)
          from (select ciudad, count(distinct visitante) as n from v where v.dia = d.dia and ciudad is not null group by ciudad order by n desc limit 15) x
      ), '{}'::jsonb),
      'enlaces', jsonb_build_object(
        'vistas', (select count(*) from v where v.dia = d.dia and v.tipo_pagina = 'enlaces'),
        'visitantes', (select count(distinct visitante) from v where v.dia = d.dia and v.tipo_pagina = 'enlaces'),
        'clics_portadas', (select count(*) from c where c.dia = d.dia and c.tipo = 'portada'),
        'visitantes_portadas', (select count(distinct visitante) from c where c.dia = d.dia and c.tipo = 'portada'),
        'clics_alertas', (select count(*) from c where c.dia = d.dia and c.tipo = 'alertas'),
        'visitantes_alertas', (select count(distinct visitante) from c where c.dia = d.dia and c.tipo = 'alertas')
      ),
      'clics', coalesce((
        select jsonb_object_agg(tipo, n) from (select tipo, count(*) as n from c where c.dia = d.dia group by tipo) x
      ), '{}'::jsonb)
    ) as datos
  from (select generate_series(p_desde, p_hasta, interval '1 day')::date as dia) d
),
por_noticia as (
  select v.dia, v.noticia_id,
    jsonb_build_object(
      'dia', v.dia,
      'noticia_id', v.noticia_id,
      'vistas', count(*),
      'visitantes', count(distinct v.visitante),
      'segundos_promedio', coalesce(round(avg(v.segundos) filter (where v.segundos > 0)), 0),
      'segundos_mediana', coalesce(round((percentile_cont(0.5) within group (order by v.segundos) filter (where v.segundos > 0))::numeric), 0),
      'scroll_promedio', coalesce(round(avg(v.scroll) filter (where v.scroll > 0)), 0),
      'lecturas', count(*) filter (where v.scroll >= 75 or v.segundos >= 60),
      'desde_enlaces', count(distinct v.visitante) filter (where v.desde_enlaces),
      'clics_portada', (select count(*) from c where c.dia = v.dia and c.tipo = 'portada' and c.noticia_id = v.noticia_id),
      'compartidos', (select count(*) from c where c.dia = v.dia and c.tipo = 'compartir' and c.noticia_id = v.noticia_id),
      'canales', (
        select jsonb_object_agg(canal_sesion, n)
          from (select v2.canal_sesion, count(distinct v2.visitante) as n from v v2
                 where v2.dia = v.dia and v2.noticia_id = v.noticia_id group by v2.canal_sesion) x
      )
    ) as datos
  from v where v.noticia_id is not null
  group by v.dia, v.noticia_id
),
tocadas as (select distinct noticia_id from v where noticia_id is not null),
acumulado as (
  select mv.noticia_id,
    jsonb_build_object(
      'noticia_id', mv.noticia_id,
      'slug', n.slug,
      'titular', n.titular,
      'publicada_at', n.publicada_at,
      'vistas', count(*),
      'visitantes', count(distinct mv.visitante),
      'segundos_promedio', coalesce(round(avg(mv.segundos) filter (where mv.segundos > 0)), 0),
      'scroll_promedio', coalesce(round(avg(mv.scroll) filter (where mv.scroll > 0)), 0),
      'desde_enlaces', count(distinct mv.visitante) filter (where mv.desde_enlaces)
    ) as datos
  from public.metricas_vistas mv
  join tocadas t on t.noticia_id = mv.noticia_id
  join public.noticias n on n.id = mv.noticia_id
  group by mv.noticia_id, n.slug, n.titular, n.publicada_at
)
select jsonb_build_object(
  'desde', p_desde,
  'hasta', p_hasta,
  'zona', p_tz,
  'generado_at', now(),
  'dias', coalesce((select jsonb_agg(datos order by dia) from dias), '[]'::jsonb),
  'noticias', coalesce((select jsonb_agg(datos) from por_noticia), '[]'::jsonb),
  'acumulado', coalesce((select jsonb_agg(datos) from acumulado), '[]'::jsonb),
  -- Personas distintas en ventanas que terminan hoy: sumar días contaría dos veces a quien vuelve.
  'visitantes_ventana', jsonb_build_object(
    '1',  (select count(distinct visitante) from public.metricas_vistas where creado_at >= ((now() at time zone p_tz)::date::timestamp at time zone p_tz)),
    '7',  (select count(distinct visitante) from public.metricas_vistas where creado_at >= (((now() at time zone p_tz)::date - 6)::timestamp at time zone p_tz)),
    '30', (select count(distinct visitante) from public.metricas_vistas where creado_at >= (((now() at time zone p_tz)::date - 29)::timestamp at time zone p_tz)),
    '60', (select count(distinct visitante) from public.metricas_vistas where creado_at >= (((now() at time zone p_tz)::date - 59)::timestamp at time zone p_tz)),
    'todo', (select count(distinct visitante) from public.metricas_vistas)
  )
);
$$;

revoke all on function public.metricas_tiempo(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.metricas_resumen(date, date, text) from public, anon, authenticated;
grant execute on function public.metricas_tiempo(uuid, integer, integer) to service_role;
grant execute on function public.metricas_resumen(date, date, text) to service_role;
