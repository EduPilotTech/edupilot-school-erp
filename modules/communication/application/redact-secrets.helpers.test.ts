import { describe, expect, it } from "vitest";
import { redactSecrets } from "./redact-secrets.helpers";

describe("redactSecrets", () => {
  it("redacts a Bearer token while preserving the 'Bearer' label", () => {
    const input = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def";
    const result = redactSecrets(input);
    expect(result).toBe("Authorization: Bearer ********");
    expect(result).toContain("Bearer");
  });

  it("redacts a standalone Bearer token with no 'Authorization:' label", () => {
    const result = redactSecrets("token: Bearer sk_live_abcdef1234567890");
    expect(result).toBe("token: Bearer ********");
  });

  it("redacts an Authorization header with the Basic scheme, preserving the scheme word", () => {
    const result = redactSecrets("Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=");
    expect(result).toBe("Authorization: Basic ********");
  });

  it("redacts an Authorization header with an arbitrary scheme", () => {
    const result = redactSecrets("Authorization: Digest ab12cd34ef56gh78");
    expect(result).toBe("Authorization: Digest ********");
  });

  it("redacts an API key while preserving the key name and separator", () => {
    expect(redactSecrets("API_KEY=abcdef123456789")).toBe("API_KEY=********");
    expect(redactSecrets("api_key: abcdef123456789")).toBe("api_key: ********");
  });

  it("redacts a Password field while preserving the field name", () => {
    expect(redactSecrets("Password=mysecretpassword")).toBe("Password=********");
  });

  it("redacts an SMTP password embedded in a connection-string URL, preserving scheme/user/host", () => {
    const input = "Connecting to smtp://mailuser:S3cretPass!@smtp.example.com:587";
    const result = redactSecrets(input);
    expect(result).toBe(`Connecting to smtp://mailuser:${"*".repeat(8)}@smtp.example.com:587`);
    expect(result).toContain("smtp://mailuser:");
    expect(result).toContain("@smtp.example.com:587");
    expect(result).not.toContain("S3cretPass!");
  });

  it("redacts a standalone JWT (three dot-separated base64url segments) with no surrounding label", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const result = redactSecrets(`token value was ${jwt} in the response`);
    expect(result).not.toContain(jwt);
    expect(result).not.toContain("eyJ");
    expect(result).toContain("token value was");
    expect(result).toContain("in the response");
  });

  it("redacts a client secret, access token, and refresh token by key name", () => {
    expect(redactSecrets("client_secret=abc123XYZsecretvalue")).toBe("client_secret=********");
    expect(redactSecrets("access_token: 4f8a9c2b7e1d6f3a5b8c9d0e1f2a3b4c")).toBe("access_token: ********");
    expect(redactSecrets("refresh_token=zyxwvutsrqponmlkjihgfedcba098765")).toBe("refresh_token=********");
  });

  it("redacts provider account identifiers flagged as server-only (phone number id, business account id, account SID)", () => {
    expect(redactSecrets("phone_number_id=1234567890123456")).toBe("phone_number_id=********");
    expect(redactSecrets("business_account_id=9876543210987654")).toBe("business_account_id=********");
    expect(redactSecrets("account_sid=TWILIO_TEST_ACCOUNT_IDENTIFIER_NOT_REAL")).toBe("account_sid=********");
  });

  it("redacts a long contiguous hex secret with no recognizable key name, without touching a UUID", () => {
    const hexSecret = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0";
    const resultWithSecret = redactSecrets(`raw secret dump: ${hexSecret}`);
    expect(resultWithSecret).not.toContain(hexSecret);

    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const resultWithUuid = redactSecrets(`notificationId: ${uuid}`);
    expect(resultWithUuid).toBe(`notificationId: ${uuid}`);
  });

  it("redacts a long base64-like secret with no recognizable key name", () => {
    const secret = "QWxhZGRpbjpPcGVuU2VzYW1lVGhpc0lzQVJlYWxseUxvbmdTZWNyZXQ=";
    const result = redactSecrets(`unexpected payload: ${secret} received`);
    expect(result).not.toContain(secret);
    expect(result).toContain("unexpected payload:");
    expect(result).toContain("received");
  });

  it("redacts multiple different secrets present in the same string", () => {
    const input =
      "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abc.def failed; API_KEY=abcdef123456789 and Password=hunter2hunter2 were used";
    const result = redactSecrets(input);
    expect(result).toContain("Authorization: Bearer ********");
    expect(result).toContain("API_KEY=********");
    expect(result).toContain("Password=********");
    expect(result).not.toContain("eyJhbGciOiJIUzI1NiJ9");
    expect(result).not.toContain("abcdef123456789");
    expect(result).not.toContain("hunter2hunter2");
  });

  it("leaves ordinary text completely unchanged", () => {
    const input = "The provider returned a 503 Service Unavailable error while sending this notification.";
    expect(redactSecrets(input)).toBe(input);
  });

  it("leaves a plain UUID identifier unchanged (not treated as a secret)", () => {
    const input = "notificationId=550e8400-e29b-41d4-a716-446655440000";
    expect(redactSecrets(input)).toBe(input);
  });

  it("handles an empty string without throwing, returning it unchanged", () => {
    expect(redactSecrets("")).toBe("");
  });

  it("handles null/undefined at runtime without throwing, per defensive input handling", () => {
    // Cast past the type system deliberately — the input is typed `string`, but this asserts the
    // function is still safe if a loosely-typed caller (e.g. `String(unknownError)` producing an
    // unexpected runtime value) ever passes something falsy through.
    expect(redactSecrets(null as unknown as string)).toBe(null);
    expect(redactSecrets(undefined as unknown as string)).toBe(undefined);
  });

  it("does not further mangle a value that has already been redacted", () => {
    const alreadyRedacted = "Authorization: Bearer ********";
    expect(redactSecrets(alreadyRedacted)).toBe(alreadyRedacted);
  });

  it("never removes the entire message — surrounding context always survives redaction", () => {
    const input = "SendGrid rejected the request: API_KEY=abcdef123456789 is invalid for this account.";
    const result = redactSecrets(input);
    expect(result).toContain("SendGrid rejected the request:");
    expect(result).toContain("is invalid for this account.");
    expect(result.length).toBeGreaterThan(0);
  });
});
