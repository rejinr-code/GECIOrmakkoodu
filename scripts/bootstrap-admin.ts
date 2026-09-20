import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

function arg(name: string): string | undefined {
  const prefix = `${name}=`;
  const found = process.argv.find((part) => part.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return undefined;
}

async function main() {
  const email = (arg("--email") ?? process.env.BOOTSTRAP_ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!email) {
    throw new Error("Pass --email you@example.com or set BOOTSTRAP_ADMIN_EMAIL");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const user = users.users.find((entry) => entry.email?.toLowerCase() === email);
  if (!user) {
    throw new Error(`No Auth user with email ${email}. Sign in once first, then re-run.`);
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("consent_version")
    .eq("id", 1)
    .single();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, batch_year, branch, consent_accepted_at, consent_version")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile row missing. Check the handle_new_user trigger.");
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      role: "admin",
      status: "verified",
      name: profile.name || email.split("@")[0],
      batch_year: profile.batch_year ?? 2007,
      branch: profile.branch ?? "CSE",
      consent_accepted_at: profile.consent_accepted_at ?? new Date().toISOString(),
      consent_version: profile.consent_version ?? settings?.consent_version ?? "1.0",
    })
    .eq("id", user.id);

  if (updateError) throw updateError;

  console.log(`Granted admin to ${email} (${user.id}). Sign out and back in so the JWT refreshes.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "bootstrap failed";
  console.error(message);
  process.exit(1);
});
