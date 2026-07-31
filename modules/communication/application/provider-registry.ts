// Phase 15B Milestone M6 — the Provider Registry approved in the Provider Framework Review,
// replacing notification-sender-factory.ts's hardcoded instantiation with an explicit,
// registration-based lookup. Deliberately NOT a plugin-scanning/auto-discovery mechanism — the
// Provider Framework Review's own conclusion was that a small, explicit registry is sufficient
// for this codebase's scale (mirroring how `lib/storage/storage-service.ts` has exactly one real
// implementation with no discovery layer); "discovery" here just means "ask what's registered."
//
// Placed in `application/`, not `infrastructure/`, and deliberately has NO "server-only" marker:
// this class has zero I/O of its own (just Maps holding factory closures) and must stay directly
// unit-testable, matching every pure helper from Milestones M1-M4. The concrete provider classes
// it will eventually be populated with (real SMTP/SendGrid/Twilio/etc. clients, Milestone M8+)
// remain properly infrastructure-layer and keep their own "server-only" markers — only the
// registry MECHANISM itself lives here.
import type { NotificationChannelValue } from "../domain/notification-delivery.entity";
import type { NotificationSender } from "../domain/notification-sender";

export class ProviderAlreadyRegisteredError extends Error {
  constructor(channel: NotificationChannelValue, providerName: string) {
    super(`A provider named "${providerName}" is already registered for channel "${channel}".`);
    this.name = "ProviderAlreadyRegisteredError";
  }
}

export class ProviderNotFoundError extends Error {
  constructor(channel: NotificationChannelValue, providerName: string) {
    super(`No provider named "${providerName}" is registered for channel "${channel}".`);
    this.name = "ProviderNotFoundError";
  }
}

// Stores a FACTORY — a () => NotificationSender — not a constructed instance. This is what makes
// provider creation lazy: registering a provider costs nothing beyond storing a closure; the
// concrete Sender (and whatever real provider SDK client it wraps) is only actually constructed
// the first time resolve() is called for that key. Once constructed, the instance is cached and
// reused on every subsequent resolve() for the same (channel, providerName) — safe because every
// NotificationSender implementation in this codebase is stateless between calls (see
// InAppNotificationSender's own precedent), and correct because it matches the Provider Framework
// Review's own recommendation to avoid paying a real SDK client's construction cost repeatedly.
export type SenderFactory = () => NotificationSender;

export class ProviderRegistry {
  private readonly factories = new Map<string, SenderFactory>();
  private readonly instances = new Map<string, NotificationSender>();

  private static key(channel: NotificationChannelValue, providerName: string): string {
    return `${channel}:${providerName}`;
  }

  // Provider Registration. Throws on a duplicate (channel, providerName) pair rather than
  // silently overwriting — a second, accidental registration under the same name is almost
  // always a bug (e.g. a module re-evaluated twice), and silently replacing the first
  // registration would be a much harder bug to track down than a loud failure at startup.
  register(channel: NotificationChannelValue, providerName: string, createSender: SenderFactory): void {
    const key = ProviderRegistry.key(channel, providerName);
    if (this.factories.has(key)) {
      throw new ProviderAlreadyRegisteredError(channel, providerName);
    }
    this.factories.set(key, createSender);
  }

  // Channel + provider-name resolution — the one place lazy construction actually happens.
  resolve(channel: NotificationChannelValue, providerName: string): NotificationSender {
    const key = ProviderRegistry.key(channel, providerName);
    const cached = this.instances.get(key);
    if (cached) return cached;

    const createSender = this.factories.get(key);
    if (!createSender) {
      throw new ProviderNotFoundError(channel, providerName);
    }

    const sender = createSender();
    this.instances.set(key, sender);
    return sender;
  }

  // Provider Discovery — which provider names are registered for a given channel, without
  // constructing any of them.
  listProviderNames(channel: NotificationChannelValue): string[] {
    const names: string[] = [];
    for (const key of this.factories.keys()) {
      const [entryChannel, providerName] = key.split(":");
      if (entryChannel === channel) names.push(providerName);
    }
    return names;
  }

  isRegistered(channel: NotificationChannelValue, providerName: string): boolean {
    return this.factories.has(ProviderRegistry.key(channel, providerName));
  }
}
