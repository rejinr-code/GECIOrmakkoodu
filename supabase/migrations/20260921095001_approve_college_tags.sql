-- Seeded college tags were forced pending by protect_event_tag (no JWT in migrations).
alter table public.event_tags disable trigger event_tags_protect;

update public.event_tags
   set status = 'approved',
       sort_order = case slug
         when 'faculty' then 120
         when 'office' then 130
         when 'college-event' then 140
         else sort_order
       end
 where slug in ('faculty', 'office', 'college-event');

alter table public.event_tags enable trigger event_tags_protect;
