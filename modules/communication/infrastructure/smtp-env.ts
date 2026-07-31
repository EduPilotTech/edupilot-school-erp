// Phase 15B Milestone M8 — server-side-only SMTP credential access. Mirrors
// lib/supabase/env.ts's exact "descriptive error instead of a bare undefined" pattern: each
// getter validates and returns exactly one variable, throwing only when actually called (never at
// module import time), so a deployment that hasn't configured SMTP can still import this module
// (e.g. via the Provider Registry) without crashing — it only fails once something genuinely tries
// to send mail or check the connection through an unconfigured provider.
//
// These variables are NEVER prefixed `NEXT_PUBLIC_` and this file is never imported by anything
// that could end up in a client bundle — the same discipline docs/SECURITY_GUIDELINES.md §5
// already requires for the Supabase service-role key.
function requireEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Configure SMTP credentials on the server ` +
        "(host, port, user, password, from-address) before using the SMTP email provider."
    );
  }
  return value;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromAddress: string;
}

// Non-throwing — used to decide WHETHER to activate the SMTP provider at all (see
// notification-sender-factory.ts), never to construct a real transporter.
export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM_ADDRESS
  );
}

// Throws a descriptive error if any required variable is missing — only ever called once
// isSmtpConfigured() (or an equivalent direct attempt) has already established intent to use SMTP.
export function getSmtpConfig(): SmtpConfig {
  const host = requireEnvVar("SMTP_HOST", process.env.SMTP_HOST);
  const portRaw = requireEnvVar("SMTP_PORT", process.env.SMTP_PORT);
  const user = requireEnvVar("SMTP_USER", process.env.SMTP_USER);
  const password = requireEnvVar("SMTP_PASSWORD", process.env.SMTP_PASSWORD);
  const fromAddress = requireEnvVar("SMTP_FROM_ADDRESS", process.env.SMTP_FROM_ADDRESS);

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid SMTP_PORT: "${portRaw}" is not a positive integer.`);
  }

  // Defaults to TLS-implied-by-port when SMTP_SECURE isn't set: port 465 is the conventional
  // implicit-TLS port; anything else (587, 25, ...) defaults to STARTTLS (secure: false, which is
  // nodemailer's own terminology for "upgrade via STARTTLS rather than connect over TLS directly").
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;

  return { host, port, secure, user, password, fromAddress };
}
