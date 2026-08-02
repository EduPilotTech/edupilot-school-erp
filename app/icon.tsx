import { ImageResponse } from "next/og";
import { getSession } from "@/lib/auth/session";
import { getCurrentUser, isUserProfileActive } from "@/lib/auth/current-user";
import { getCurrentSchool } from "@/lib/auth/auth-context";
import { getSchoolBranding } from "@/modules/branding/application/get-school-branding.service";

// Completion Pass — Dynamic favicon (checklist #5). Next.js's `icon` file convention: this route
// generates `/icon` and takes precedence over the static `app/favicon.ico` in the browser tab.
// Regenerated per-request (not cached as a static asset) so it always reflects the current
// tenant's branding — deliberately fetches the branding logo and re-embeds it as a data URI
// inside a fresh ImageResponse rather than redirecting to the signed Storage URL directly, since
// that URL expires hourly (see SupabaseStorageService.signedUrl's default) and a cached browser
// favicon pointing at an expired URL would silently break.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

function initialAvatar(letter: string, background: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
          color: "white",
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        {letter}
      </div>
    ),
    size
  );
}

export default async function Icon() {
  const session = await getSession();
  if (!session) return initialAvatar("E", "#2563eb");

  const userProfile = await getCurrentUser();
  if (!userProfile || !isUserProfileActive(userProfile)) return initialAvatar("E", "#2563eb");

  const school = await getCurrentSchool().catch(() => null);
  if (!school) return initialAvatar("E", "#2563eb");

  const branding = await getSchoolBranding({ tenantId: userProfile.tenantId, school });
  const brandColor = branding.themeColor ?? "#2563eb";

  const logoDataUri = await fetchLogoAsDataUri(branding.logoUrl);
  if (logoDataUri) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori (ImageResponse) requires a plain <img>, not next/image. */}
          <img
            src={logoDataUri}
            alt=""
            width={size.width}
            height={size.height}
            style={{ objectFit: "contain" }}
          />
        </div>
      ),
      size
    );
  }

  return initialAvatar(branding.schoolName.charAt(0).toUpperCase(), brandColor);
}

// Split out from the component body so the try/catch never wraps JSX construction (React's
// error-boundary rule: JSX is not rendered synchronously, so a try/catch around it would never
// actually catch anything — the fetch itself is the only part that can genuinely throw here).
async function fetchLogoAsDataUri(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = response.headers.get("content-type") ?? "image/png";
    return `data:${mime};base64,${base64}`;
  } catch {
    // A broken/unreachable logo must never break the favicon entirely — the caller falls back
    // to the initial-letter avatar.
    return null;
  }
}
