import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/`);
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/sign-in?error=link`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, batch_year, branch, consent_accepted_at")
        .eq("id", user.id)
        .maybeSingle();
      const incomplete =
        !profile?.name ||
        !profile.batch_year ||
        !profile.branch ||
        !profile.consent_accepted_at;
      if (incomplete) {
        return NextResponse.redirect(`${origin}/join`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/"}`);
}
