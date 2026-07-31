import { describe, expect, it } from "vitest";
import { isConfigurableProvider } from "./configurable-provider";
import { isHealthCheckableProvider } from "./health-checkable-provider";

describe("isConfigurableProvider", () => {
  it("returns true for an object implementing both required methods", () => {
    const provider = {
      validateConfiguration: () => ({ valid: true, errors: [] }),
      testConnection: async () => ({ success: true, message: "ok" }),
    };
    expect(isConfigurableProvider(provider)).toBe(true);
  });

  it("returns false when validateConfiguration is missing", () => {
    const provider = { testConnection: async () => ({ success: true, message: "ok" }) };
    expect(isConfigurableProvider(provider)).toBe(false);
  });

  it("returns false when testConnection is missing", () => {
    const provider = { validateConfiguration: () => ({ valid: true, errors: [] }) };
    expect(isConfigurableProvider(provider)).toBe(false);
  });

  it("returns false for null, undefined, and primitives", () => {
    expect(isConfigurableProvider(null)).toBe(false);
    expect(isConfigurableProvider(undefined)).toBe(false);
    expect(isConfigurableProvider("a string")).toBe(false);
    expect(isConfigurableProvider(42)).toBe(false);
  });

  it("returns false for a plain object with unrelated methods", () => {
    expect(isConfigurableProvider({ send: () => {} })).toBe(false);
  });
});

describe("isHealthCheckableProvider", () => {
  it("returns true for an object implementing healthCheck", () => {
    const provider = { healthCheck: async () => ({ healthy: true }) };
    expect(isHealthCheckableProvider(provider)).toBe(true);
  });

  it("returns false when healthCheck is missing", () => {
    expect(isHealthCheckableProvider({ send: () => {} })).toBe(false);
  });

  it("returns false for null, undefined, and primitives", () => {
    expect(isHealthCheckableProvider(null)).toBe(false);
    expect(isHealthCheckableProvider(undefined)).toBe(false);
    expect(isHealthCheckableProvider(7)).toBe(false);
  });

  it("a provider can implement both ConfigurableProvider and HealthCheckableProvider at once", () => {
    const provider = {
      validateConfiguration: () => ({ valid: true, errors: [] }),
      testConnection: async () => ({ success: true, message: "ok" }),
      healthCheck: async () => ({ healthy: true }),
    };
    expect(isConfigurableProvider(provider)).toBe(true);
    expect(isHealthCheckableProvider(provider)).toBe(true);
  });
});
