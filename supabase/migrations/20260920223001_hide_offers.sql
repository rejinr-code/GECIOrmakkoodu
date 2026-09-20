-- Pause public mentoring/internship offers until they are wanted again.
update public.settings
   set feature_mentoring = false
 where id = 1;
