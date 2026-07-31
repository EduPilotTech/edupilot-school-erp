// Phase 15B Milestone M5 — approved in the Provider Framework Review. A separate, OPTIONAL
// interface for configuration-time concerns (validating a credential's shape, confirming it
// actually works against the real service) — deliberately NOT added to EmailProvider/SMSProvider/
// WhatsAppProvider themselves, since those interfaces are about SENDING, not administration. A
// concrete provider MAY implement this in addition to its core interface; the admin settings
// UI/action layer (a later milestone) checks for its presence via `isConfigurableProvider()`
// before calling it — the dispatch/queue path never touches this interface at all.
export interface ConfigurationValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export interface ConfigurableProvider {
  validateConfiguration(config: unknown): ConfigurationValidationResult;
  testConnection(): Promise<TestConnectionResult>;
}

// Runtime type-guard — a concrete provider's static type doesn't need to declare
// `implements ConfigurableProvider` for this to work; it just needs the two methods to actually
// be present, which is all a caller can rely on before invoking them.
export function isConfigurableProvider(provider: unknown): provider is ConfigurableProvider {
  return (
    typeof provider === "object" &&
    provider !== null &&
    typeof (provider as Partial<ConfigurableProvider>).validateConfiguration === "function" &&
    typeof (provider as Partial<ConfigurableProvider>).testConnection === "function"
  );
}
