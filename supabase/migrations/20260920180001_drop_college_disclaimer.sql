-- Drop the college-disclaimer and founding-maintainer sentences from public legal copy.

update public.legal_documents
set body_markdown = replace(
  body_markdown,
  ' It is built and operated by alumni volunteers. **Government Engineering College Idukki has no ownership, role, or responsibility for this archive.**',
  ''
)
where slug = 'privacy';

update public.legal_documents
set body_markdown = replace(
  body_markdown,
  E'The site is run by GECIAN alumni volunteers. It is **not** an official system of Government Engineering College Idukki. The college has no ownership, role, or responsibility for this project.\n',
  E'The site is run by GECIAN alumni volunteers.\n'
)
where slug = 'terms';

update public.legal_documents
set body_markdown = replace(
  body_markdown,
  'Ormakkoodu is maintained by GECIAN alumni volunteers. There is no appointed grievance officer and no college office behind this archive. Government Engineering College Idukki has no ownership, role, or responsibility for it.',
  'Ormakkoodu is maintained by GECIAN alumni volunteers. There is no appointed grievance officer.'
)
where slug = 'contact';
