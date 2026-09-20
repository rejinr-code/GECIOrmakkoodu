import { createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const TABLES = [
  "settings",
  "legal_documents",
  "event_tags",
  "profiles",
  "alumni_register",
  "batch_groups",
  "photos",
  "articles",
  "comments",
  "reactions",
  "reports",
  "monthly_prompts",
  "audit_log",
] as const;

const BUCKETS = ["photos", "thumbs"] as const;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const root = join(process.cwd(), "export-dump", stamp);
  mkdirSync(join(root, "tables"), { recursive: true });
  mkdirSync(join(root, "files"), { recursive: true });

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw new Error(`${table}: ${error.message}`);
    writeFileSync(
      join(root, "tables", `${table}.json`),
      JSON.stringify(data ?? [], null, 2),
      "utf8",
    );
    console.log(`wrote ${table} (${data?.length ?? 0} rows)`);
  }

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) throw authError;
  writeFileSync(
    join(root, "tables", "auth_users.json"),
    JSON.stringify(
      (authUsers.users ?? []).map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      })),
      null,
      2,
    ),
    "utf8",
  );

  for (const bucket of BUCKETS) {
    const { data: objects, error } = await supabase.storage.from(bucket).list("", {
      limit: 10000,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`${bucket}: ${error.message}`);

    await downloadPrefix(
      supabase as unknown as StorageClient,
      bucket,
      "",
      join(root, "files", bucket),
      (objects ?? []) as StorageItem[],
    );
  }

  writeFileSync(
    join(root, "README.txt"),
    [
      "Ormakkoodu data export",
      `Date: ${new Date().toISOString()}`,
      "tables/ — JSON dump of every public table, plus auth user emails (no passwords).",
      "files/photos and files/thumbs — stored image bytes.",
      "This dump is enough to leave this codebase or this host.",
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(`export complete: ${root}`);
}

type StorageItem = { name: string; id: string | null; metadata: Record<string, unknown> | null };

type StorageClient = {
  storage: {
    from: (bucket: string) => {
      list: (
        path: string,
        options?: { limit?: number },
      ) => Promise<{ data: StorageItem[] | null; error: { message: string } | null }>;
      download: (
        path: string,
      ) => Promise<{ data: Blob | null; error: { message: string } | null }>;
    };
  };
};

async function downloadPrefix(
  supabase: StorageClient,
  bucket: string,
  prefix: string,
  destRoot: string,
  items: StorageItem[],
): Promise<void> {
  for (const item of items) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (!item.id) {
      const { data: children, error } = await supabase.storage.from(bucket).list(path, {
        limit: 10000,
      });
      if (error) throw new Error(`${bucket}/${path}: ${error.message}`);
      await downloadPrefix(supabase, bucket, path, destRoot, children ?? []);
      continue;
    }

    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) throw new Error(`${bucket}/${path}: ${error?.message ?? "empty"}`);

    const dest = join(destRoot, path);
    mkdirSync(dirname(dest), { recursive: true });
    const nodeStream = Readable.fromWeb(data.stream() as never);
    await pipeline(nodeStream, createWriteStream(dest));
    console.log(`file ${bucket}/${path}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "export failed";
  console.error(message);
  process.exit(1);
});
