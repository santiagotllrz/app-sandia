-- Portadas de los carruseles para la página de enlaces (/enlaces, la del link de la bio).
-- Llegan por el webhook con el evento noticia.portada; la imagen se copia al bucket `noticias`.
-- upsert_noticia no toca estas columnas, así que una actualización de la nota conserva su portada.

alter table public.noticias
  add column if not exists portada_url   text,
  add column if not exists portada_ancho integer,
  add column if not exists portada_alto  integer,
  add column if not exists portada_at    timestamptz;

create index if not exists noticias_portadas_idx
  on public.noticias (portada_at desc)
  where portada_url is not null and estado = 'publicada';
