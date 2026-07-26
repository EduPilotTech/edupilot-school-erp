// Environment variable access for the Supabase clients, with descriptive startup errors
// instead of a bare "undefined" reaching the Supabase SDK. Each getter validates and returns
// exactly one variable — kept separate (rather than one big "validate everything" function) so
// that code which only ever needs the public URL/anon key (client.ts, server.ts) never even
// references SUPABASE_SERVICE_ROLE_KEY, and can never accidentally trigger a check for it.

function requireEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local ` +
        `(and .env for Prisma) and set it — see docs/ENVIRONMENT_VARIABLES.md.`
    );
  }
  return value;
}

// Safe to call from browser or server code — this is the public Supabase project URL.
export function getSupabaseUrl(): string {
  return requireEnvVar("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

// Safe to call from browser or server code — access via this key is governed entirely by
// Row Level Security, not by keeping it secret (see docs/SECURITY_GUIDELINES.md §5).
export function getSupabaseAnonKey(): string {
  return requireEnvVar(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Server-only. Bypasses Row Level Security entirely — never call this from client.ts or any
// code path that could be bundled for the browser. See lib/supabase/admin.ts.
export function getSupabaseServiceRoleKey(): string {
  return requireEnvVar("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
