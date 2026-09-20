-- Authors may revise a rejected letter and send it back as draft or pending.

drop policy if exists articles_update_own on public.articles;

create policy articles_update_own
  on public.articles for update to authenticated
  using (author_id = auth.uid() and status in ('draft', 'pending', 'published', 'rejected'))
  with check (author_id = auth.uid());
