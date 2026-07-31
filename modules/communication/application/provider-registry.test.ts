import { describe, expect, it, vi } from "vitest";
import { ProviderAlreadyRegisteredError, ProviderNotFoundError, ProviderRegistry } from "./provider-registry";
import type { NotificationSender } from "../domain/notification-sender";

function fakeSender(channel: NotificationSender["channel"]): NotificationSender {
  return {
    channel,
    send: vi.fn().mockResolvedValue({ status: "SENT" }),
  };
}

describe("ProviderRegistry", () => {
  // --- Registry registration ------------------------------------------------------------------
  it("registers a provider for a channel without throwing", () => {
    const registry = new ProviderRegistry();
    expect(() => registry.register("EMAIL", "sendgrid", () => fakeSender("EMAIL"))).not.toThrow();
    expect(registry.isRegistered("EMAIL", "sendgrid")).toBe(true);
  });

  it("allows the same provider name on different channels", () => {
    const registry = new ProviderRegistry();
    registry.register("SMS", "genericgateway", () => fakeSender("SMS"));
    expect(() => registry.register("WHATSAPP", "genericgateway", () => fakeSender("WHATSAPP"))).not.toThrow();
  });

  // --- Duplicate registration ------------------------------------------------------------------
  it("throws ProviderAlreadyRegisteredError on a duplicate (channel, providerName) registration", () => {
    const registry = new ProviderRegistry();
    registry.register("EMAIL", "sendgrid", () => fakeSender("EMAIL"));
    expect(() => registry.register("EMAIL", "sendgrid", () => fakeSender("EMAIL"))).toThrow(ProviderAlreadyRegisteredError);
  });

  it("does not throw when re-registering the same provider name under a different channel", () => {
    const registry = new ProviderRegistry();
    registry.register("EMAIL", "sendgrid", () => fakeSender("EMAIL"));
    expect(() => registry.register("SMS", "sendgrid", () => fakeSender("SMS"))).not.toThrow();
  });

  // --- Provider lookup -------------------------------------------------------------------------
  it("resolves a registered provider to the correct sender", () => {
    const registry = new ProviderRegistry();
    const sender = fakeSender("EMAIL");
    registry.register("EMAIL", "sendgrid", () => sender);
    expect(registry.resolve("EMAIL", "sendgrid")).toBe(sender);
  });

  it("caches the resolved instance — repeated resolve() calls return the same instance without re-invoking the factory", () => {
    const registry = new ProviderRegistry();
    const factory = vi.fn(() => fakeSender("EMAIL"));
    registry.register("EMAIL", "sendgrid", factory);

    const first = registry.resolve("EMAIL", "sendgrid");
    const second = registry.resolve("EMAIL", "sendgrid");

    expect(first).toBe(second);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("does not invoke the factory until resolve() is actually called (lazy construction)", () => {
    const registry = new ProviderRegistry();
    const factory = vi.fn(() => fakeSender("SMS"));
    registry.register("SMS", "twilio", factory);
    expect(factory).not.toHaveBeenCalled();

    registry.resolve("SMS", "twilio");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("lists every registered provider name for a channel (provider discovery)", () => {
    const registry = new ProviderRegistry();
    registry.register("EMAIL", "sendgrid", () => fakeSender("EMAIL"));
    registry.register("EMAIL", "ses", () => fakeSender("EMAIL"));
    registry.register("SMS", "twilio", () => fakeSender("SMS"));

    expect(registry.listProviderNames("EMAIL").sort()).toEqual(["sendgrid", "ses"]);
    expect(registry.listProviderNames("SMS")).toEqual(["twilio"]);
  });

  it("returns an empty list for a channel with nothing registered", () => {
    const registry = new ProviderRegistry();
    expect(registry.listProviderNames("WHATSAPP")).toEqual([]);
  });

  // --- Missing provider ------------------------------------------------------------------------
  it("throws ProviderNotFoundError when resolving an unregistered provider", () => {
    const registry = new ProviderRegistry();
    expect(() => registry.resolve("EMAIL", "does-not-exist")).toThrow(ProviderNotFoundError);
  });

  it("throws ProviderNotFoundError when resolving a provider registered under a different channel", () => {
    const registry = new ProviderRegistry();
    registry.register("EMAIL", "sendgrid", () => fakeSender("EMAIL"));
    expect(() => registry.resolve("SMS", "sendgrid")).toThrow(ProviderNotFoundError);
  });

  it("isRegistered returns false for an unregistered (channel, providerName) pair", () => {
    const registry = new ProviderRegistry();
    expect(registry.isRegistered("EMAIL", "nope")).toBe(false);
  });

  it("supports every channel value, including PUSH", () => {
    const registry = new ProviderRegistry();
    for (const channel of ["IN_APP", "EMAIL", "SMS", "WHATSAPP", "PUSH"] as const) {
      registry.register(channel, "test-provider", () => fakeSender(channel));
      expect(registry.resolve(channel, "test-provider").channel).toBe(channel);
    }
  });

  // --- Registry resolution mirroring the real Milestone M8/M9 scenario -------------------------
  // notification-sender-factory.ts itself can't be unit-tested directly (it carries "server-only"
  // deliberately, since it's the actual production wiring point) — this exercises the same
  // "two providers registered for one channel, each independently resolvable" shape it relies on:
  // EMAIL has both "unconfigured" (the honest stub) and "smtp" (the real Nodemailer-backed
  // provider) registered side by side.
  it("resolves each of two competing providers registered for the same channel independently, without one affecting the other", () => {
    const registry = new ProviderRegistry();
    const unconfigured = fakeSender("EMAIL");
    const smtp = fakeSender("EMAIL");

    registry.register("EMAIL", "unconfigured", () => unconfigured);
    registry.register("EMAIL", "smtp", () => smtp);

    expect(registry.resolve("EMAIL", "unconfigured")).toBe(unconfigured);
    expect(registry.resolve("EMAIL", "smtp")).toBe(smtp);
    expect(registry.resolve("EMAIL", "unconfigured")).not.toBe(registry.resolve("EMAIL", "smtp"));
    expect(registry.listProviderNames("EMAIL").sort()).toEqual(["smtp", "unconfigured"]);
  });

  // Same shape, mirroring Milestone M10's real SMS registration ("unconfigured" + "http-gateway").
  it("resolves each of two competing SMS providers registered for the SMS channel independently", () => {
    const registry = new ProviderRegistry();
    const unconfigured = fakeSender("SMS");
    const httpGateway = fakeSender("SMS");

    registry.register("SMS", "unconfigured", () => unconfigured);
    registry.register("SMS", "http-gateway", () => httpGateway);

    expect(registry.resolve("SMS", "unconfigured")).toBe(unconfigured);
    expect(registry.resolve("SMS", "http-gateway")).toBe(httpGateway);
    expect(registry.listProviderNames("SMS").sort()).toEqual(["http-gateway", "unconfigured"]);
  });

  // Same shape, mirroring Milestone M11's real WhatsApp registration ("unconfigured" +
  // "whatsapp-cloud-api").
  it("resolves each of two competing WhatsApp providers registered for the WHATSAPP channel independently", () => {
    const registry = new ProviderRegistry();
    const unconfigured = fakeSender("WHATSAPP");
    const cloudApi = fakeSender("WHATSAPP");

    registry.register("WHATSAPP", "unconfigured", () => unconfigured);
    registry.register("WHATSAPP", "whatsapp-cloud-api", () => cloudApi);

    expect(registry.resolve("WHATSAPP", "unconfigured")).toBe(unconfigured);
    expect(registry.resolve("WHATSAPP", "whatsapp-cloud-api")).toBe(cloudApi);
    expect(registry.listProviderNames("WHATSAPP").sort()).toEqual(["unconfigured", "whatsapp-cloud-api"]);
  });
});
