"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSchoolBrandingAction } from "@/app/settings/branding/actions";
import { BrandingAssetUploader } from "./BrandingAssetUploader";
import { BrandingPreviewCard } from "./BrandingPreviewCard";
import type { SchoolBrandingDTO } from "@/modules/branding/application/dto/school-branding.dto";

interface SchoolBrandingManagerProps {
  branding: SchoolBrandingDTO;
  canManage: boolean;
}

function toInputValue(value: string | null): string {
  return value ?? "";
}

export function SchoolBrandingManager({ branding, canManage }: SchoolBrandingManagerProps) {
  const router = useRouter();

  const [headerText, setHeaderText] = useState(toInputValue(branding.headerText));
  const [footerText, setFooterText] = useState(toInputValue(branding.footerText));
  const [motto, setMotto] = useState(toInputValue(branding.motto));
  const [themeColor, setThemeColor] = useState(branding.themeColor ?? "#1D4ED8");
  const [facebookUrl, setFacebookUrl] = useState(toInputValue(branding.socialMedia.facebook));
  const [twitterUrl, setTwitterUrl] = useState(toInputValue(branding.socialMedia.twitter));
  const [instagramUrl, setInstagramUrl] = useState(toInputValue(branding.socialMedia.instagram));
  const [linkedinUrl, setLinkedinUrl] = useState(toInputValue(branding.socialMedia.linkedin));
  const [youtubeUrl, setYoutubeUrl] = useState(toInputValue(branding.socialMedia.youtube));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await updateSchoolBrandingAction({
        headerText,
        footerText,
        motto,
        themeColor,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        linkedinUrl,
        youtubeUrl,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-medium text-zinc-900">School Profile</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Read from the school&apos;s registration record — edit in Settings → School Configuration.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-zinc-500">Name</dt>
            <dd className="text-zinc-900">{branding.schoolName}</dd>
            <dt className="text-zinc-500">Short Name</dt>
            <dd className="text-zinc-900">{branding.shortName ?? "—"}</dd>
            <dt className="text-zinc-500">Registration No.</dt>
            <dd className="text-zinc-900">{branding.registrationNumber}</dd>
            <dt className="text-zinc-500">Board</dt>
            <dd className="text-zinc-900">{branding.board}</dd>
            <dt className="text-zinc-500">Principal</dt>
            <dd className="text-zinc-900">{branding.principalName}</dd>
            <dt className="text-zinc-500">Email</dt>
            <dd className="text-zinc-900">{branding.email}</dd>
            <dt className="text-zinc-500">Phone</dt>
            <dd className="text-zinc-900">{branding.phone}</dd>
            <dt className="text-zinc-500">Website</dt>
            <dd className="text-zinc-900">{branding.website ?? "—"}</dd>
            <dt className="text-zinc-500">Address</dt>
            <dd className="text-zinc-900">{branding.address}</dd>
            <dt className="text-zinc-500">City</dt>
            <dd className="text-zinc-900">{branding.city}</dd>
            <dt className="text-zinc-500">District</dt>
            <dd className="text-zinc-900">{branding.district}</dd>
            <dt className="text-zinc-500">State</dt>
            <dd className="text-zinc-900">{branding.state}</dd>
            <dt className="text-zinc-500">Country</dt>
            <dd className="text-zinc-900">{branding.country}</dd>
            <dt className="text-zinc-500">Postal Code</dt>
            <dd className="text-zinc-900">{branding.postalCode}</dd>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-medium text-zinc-900">Assets</h2>
          <div className="mt-3 flex flex-wrap gap-6">
            <BrandingAssetUploader assetType="LOGO" label="School Logo" currentUrl={branding.logoUrl} canManage={canManage} shape="square" />
            <BrandingAssetUploader assetType="SIGNATURE" label="Principal Signature" currentUrl={branding.signatureUrl} canManage={canManage} shape="wide" />
            <BrandingAssetUploader assetType="SEAL" label="School Seal" currentUrl={branding.sealUrl} canManage={canManage} shape="square" />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-medium text-zinc-900">Letterhead &amp; Theme</h2>
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
              School Header
              <input
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                disabled={!canManage}
                placeholder="Excellence in Education Since 1995"
                maxLength={300}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 disabled:bg-zinc-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
              School Footer
              <input
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                disabled={!canManage}
                placeholder="This is a computer-generated document."
                maxLength={300}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 disabled:bg-zinc-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
              School Motto
              <input
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                disabled={!canManage}
                placeholder="Knowledge is Power"
                maxLength={200}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 disabled:bg-zinc-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
              Theme Color
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={/^#([0-9A-Fa-f]{6})$/.test(themeColor) ? themeColor : "#1D4ED8"}
                  onChange={(e) => setThemeColor(e.target.value)}
                  disabled={!canManage}
                  className="h-9 w-12 rounded border border-zinc-300 disabled:opacity-60"
                />
                <input
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  disabled={!canManage}
                  placeholder="#1D4ED8"
                  className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 disabled:bg-zinc-50"
                />
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-medium text-zinc-900">Social Media</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: "Facebook", value: facebookUrl, setValue: setFacebookUrl },
              { label: "Twitter / X", value: twitterUrl, setValue: setTwitterUrl },
              { label: "Instagram", value: instagramUrl, setValue: setInstagramUrl },
              { label: "LinkedIn", value: linkedinUrl, setValue: setLinkedinUrl },
              { label: "YouTube", value: youtubeUrl, setValue: setYoutubeUrl },
            ].map((field) => (
              <label key={field.label} className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
                {field.label}
                <input
                  value={field.value}
                  onChange={(e) => field.setValue(e.target.value)}
                  disabled={!canManage}
                  placeholder="https://…"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 disabled:bg-zinc-50"
                />
              </label>
            ))}
          </div>
        </section>

        {canManage && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save Branding"}
            </button>
            {savedAt && !error && <span className="text-sm text-emerald-600">Saved.</span>}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <h2 className="mb-3 text-sm font-medium text-zinc-900">Live Preview</h2>
        <BrandingPreviewCard
          schoolName={branding.schoolName}
          address={`${branding.address}, ${branding.city}, ${branding.state} ${branding.postalCode}`}
          phone={branding.phone}
          email={branding.email}
          logoUrl={branding.logoUrl}
          signatureUrl={branding.signatureUrl}
          sealUrl={branding.sealUrl}
          headerText={headerText}
          footerText={footerText}
          themeColor={themeColor}
          motto={motto}
        />
      </div>
    </div>
  );
}
