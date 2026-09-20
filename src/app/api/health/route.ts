import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

export async function GET() {
  try {
    if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
      return Response.json({ ok: false, reason: "unconfigured" }, { status: 503 });
    }

    const supabase = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
    const { error } = await supabase.from("settings").select("id").limit(1).maybeSingle();

    if (error) {
      return Response.json({ ok: false, reason: error.message }, { status: 503 });
    }

    return Response.json({ ok: true, service: "ormakkoodu" });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
