-- Operational defaults. Branding strings here match src/config/site.ts at first
-- boot; admins may later edit contact email, consent version, and flags.

insert into public.settings (
  id,
  site_name,
  tagline,
  association_name,
  moderation_photos,
  moderation_articles,
  moderation_comments,
  contact_email,
  consent_version,
  feature_photos,
  feature_articles,
  feature_comments,
  feature_directory,
  feature_mentoring,
  feature_monthly_prompt,
  upload_limit_per_day,
  comment_limit_per_day,
  retention_days
) values (
  1,
  'Ormakkoodu',
  'the GECIAN archive',
  'GECIAN',
  true,
  true,
  false,
  'archive@example.org',
  '1.0',
  true,
  true,
  false,
  false,
  false,
  false,
  20,
  50,
  90
);

insert into public.event_tags (slug, label, sort_order) values
  ('campus', 'Campus', 10),
  ('hostel', 'Hostel', 20),
  ('classroom', 'Classroom', 30),
  ('workshop', 'Workshop', 40),
  ('arts', 'Arts fest', 50),
  ('sports', 'Sports', 60),
  ('college-day', 'College day', 70),
  ('farewell', 'Farewell', 80),
  ('trip', 'Trip', 90),
  ('reunion', 'Reunion', 100),
  ('other', 'Other', 110);

insert into public.legal_documents (slug, title, body_markdown, version) values
(
  'privacy',
  'Privacy notice',
  $md$
# Privacy notice

**Version 1.0**

Ormakkoodu (ഓർമ്മക്കൂട്) is a memory archive run by **GECIAN**, the alumni association of Government Engineering College Idukki, Kerala. It is built and operated by alumni volunteers. **Government Engineering College Idukki has no ownership, role, or responsibility for this archive.**

This notice explains what we collect, why, and the rights you have under the Digital Personal Data Protection Act, 2023 (DPDP Act). We are the data fiduciary for personal data processed on this site.

## What we collect

- Account: name, email address, batch year, branch, optional phone number, optional city and current role, optional bio and avatar.
- Contributions: photographs you upload (and captions, alt text, event tags, names you type), articles, comments, and the single “remember this” reaction.
- Consent: the version of this notice you accepted, and the time you accepted it.
- Reports you submit about content.
- Technical logs needed to keep the service running (for example, authentication events).

We do **not** collect payment information. We do **not** use face recognition or any biometric processing to tag people. Names on photographs are typed by the uploader, never inferred from faces.

## What we do not publish

Phone numbers and email addresses are never listed on public pages. WhatsApp invite links for batch groups are shown only to verified members.

## Why we process data

- To run an alumni photograph and writing archive, on the basis of your consent.
- To verify that a contributor is an alumnus, against the alumni register held by volunteer administrators.
- To moderate content, handle reports, and respond to removal requests.
- To keep the archive available to visitors without an account (looking does not require signing in; contributing does).

## Storage and processors

Files and the database are hosted on Supabase in the region chosen by the current operator. Image bytes are stored in object storage, not in the database. We may later move image files to another host; the association will remain the data fiduciary.

## How long we keep data

- Profiles and published contributions: while the archive operates, or until you delete your account or we grant a removal request.
- Removed content: hidden immediately, retained for 90 days, then permanently deleted.
- If you delete your account: your profile is removed and your remaining contributions are kept in the archive attributed to “Former member”, unless you also ask for those items to be taken down.

## Your rights

You may access a copy of your data, correct it, withdraw consent, or delete your account from your profile. You may request removal of a specific photograph or article via the “request removal” link on that item. Withdrawal of consent does not undo publication that already occurred under a licence you granted; use the takedown procedure for that.

If the privacy notice version changes, we will ask for consent again before you can continue contributing.

## Children

This archive is for alumni of an engineering college. It is not directed at children.

## Contact

Questions, complaints, and removal requests go to the GECIAN alumni volunteers who run this archive, at the contact email published on the Contact page and in the site footer. There is no separate grievance officer; the same volunteers handle correspondence. If you are not satisfied, you may also approach the Data Protection Board of India.
$md$,
  '1.0'
),
(
  'terms',
  'Terms of use',
  $md$
# Terms of use

**Version 1.0**

Ormakkoodu is a volunteer-run alumni archive. By creating an account or submitting content you agree to these terms.

## Who runs this

The site is run by GECIAN alumni volunteers. It is **not** an official system of Government Engineering College Idukki. The college has no ownership, role, or responsibility for this project.

The archive is provided as-is, without warranty. Volunteers give their time; they do not promise uninterrupted service or any particular feature.

## Accounts

New accounts start as **pending**. Pending members may browse approved public content. They may not upload, write, or comment until an administrator verifies them against the alumni register. We may reject or suspend an account.

Auth is by email magic link or Google. We do not use phone OTP.

## Your content

You keep copyright in what you created. For each photograph you must confirm: you took it or have permission to share it, and you grant GECIAN a **non-exclusive** licence to publish and archive it on Ormakkoodu. You may request removal later (see the takedown procedure).

All uploads and articles are moderated. Nothing is public until a moderator approves or publishes it. There is no path around that.

Do not upload material that is illegal, that you do not have the right to share, that depicts others in a way they have not agreed to, or that violates the content policy.

## Looking without an account

Anyone may view approved photographs and published articles. Sharing a link must not land on a login wall.

## Liability

Volunteers, GECIAN, and the operators of this site are not liable for user-submitted content, downtime, or loss of data beyond what Indian law requires. This is a community archive, not a backup service. Operators provide a data-export path so the association is not locked to one host.

## Law

These terms are governed by the laws of India. Courts at Idukki, Kerala have jurisdiction, without prejudice to any rights you have under the DPDP Act.
$md$,
  '1.0'
),
(
  'content-policy',
  'Content policy',
  $md$
# Content policy

**Version 1.0**

Ormakkoodu is a nest of memories: campus photographs, hostel corridors, workshops, arts and sports, and writing about years at Government Engineering College Idukki.

## Welcome

- Photographs you took, or that you have permission to share, from college life and alumni gatherings.
- Honest writing about campus years, in English or Malayalam.
- Names typed as tags, only when you are confident the person is happy to be named.

## Not welcome

- Anything illegal under Indian law.
- Sexual content, intimate images, or photographs of people in private spaces without their agreement.
- Hate, harassment, or content whose purpose is to humiliate.
- Advertising, campaigning, or fundraising pitches (those may belong to a later community phase, not the memory wall).
- Material you do not have the right to publish.
- Automated face tagging or any biometric identification — that is permanently out of scope, including for operators.

## Moderation

Photographs and articles are held until a moderator approves them. Comments are post-moderated and may be hidden. Moderators may reject with a reason. Repeated violations can lead to suspension.

Report anything that should not be here. A report is not a public comment.

## Licence

Every photograph requires the licence confirmation. Without it, the file is not accepted.
$md$,
  '1.0'
),
(
  'takedown',
  'Takedown procedure',
  $md$
# Takedown procedure

**Version 1.0**

Anyone can ask for a photograph or article to be removed from public view, whether they uploaded it or they appear in it.

## How to ask

Use the **request removal** link on the item. It opens a message to the alumni volunteers who run this archive, with the item reference already filled. You may also write to the contact email published on this site.

Say who you are, which item you mean, and why it should come down (for example: you did not agree to be shown; you no longer want your own upload public; the file infringes your copyright; it is personal data you want erased).

You do not need an account to send a removal request.

## What we do

- We hide the item from the public archive while we look at the request.
- We aim to acknowledge within 15 days and decide within 30 days.
- If we remove it, the row is marked removed, kept for 90 days for dispute handling, then purged.

If we decline, we will say why. You may escalate to the Data Protection Board of India where that is available to you.

Uploads never skip moderation, and operators must not restore removed items to the public wall without a recorded decision.
$md$,
  '1.0'
),
(
  'contact',
  'Contact',
  $md$
# Contact

**Version 1.0**

Ormakkoodu is maintained by GECIAN alumni volunteers. There is no appointed grievance officer and no college office behind this archive. Government Engineering College Idukki has no ownership, role, or responsibility for it.

Write to the contact email published in the site footer (and in settings, which volunteers can update without a code change) with:

- your name and a way to reach you
- the item reference (from the request-removal link) if the message is about a photograph or article
- what you would like us to do

We aim to acknowledge messages within 15 days. Volunteers do this in their spare time; please treat the correspondence as community mail, not as an institutional helpdesk.

If your concern is about personal data under the DPDP Act and you are not satisfied with our reply, you may approach the Data Protection Board of India.
$md$,
  '1.0'
);
