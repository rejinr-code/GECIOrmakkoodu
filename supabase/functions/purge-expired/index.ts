import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  const secret = Deno.env.get("PURGE_SECRET");
  const header = req.headers.get("x-purge-secret");
  if (!secret || header !== secret) {
    return new Response("unauthorized", { status: 401 });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return Response.json({ ok: false, reason: "unconfigured" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("purge_expired_content");
  if (error) {
    return Response.json({ ok: false, reason: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, purged: data });
});
