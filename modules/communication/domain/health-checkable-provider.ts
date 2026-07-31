// Phase 15B Milestone M5 — approved in the Provider Framework Review. A separate, OPTIONAL
// interface — not every provider needs a meaningful health check (some gateways expose no such
// endpoint), so this is never required by EmailProvider/SMSProvider/WhatsAppProvider itself. A
// concrete provider MAY implement it; callers check via `isHealthCheckableProvider()` first.
export interface HealthCheckResult {
  healthy: boolean;
  details?: string;
}

export interface HealthCheckableProvider {
  healthCheck(): Promise<HealthCheckResult>;
}

export function isHealthCheckableProvider(provider: unknown): provider is HealthCheckableProvider {
  return (
    typeof provider === "object" &&
    provider !== null &&
    typeof (provider as Partial<HealthCheckableProvider>).healthCheck === "function"
  );
}
