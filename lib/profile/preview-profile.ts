export type PreviewProfile = {
  fullName: string;
  phone: string;
  practiceState: string;
};

export const previewProfile: PreviewProfile = {
  fullName: "Adaeze Okonkwo",
  phone: "+2348031224467",
  practiceState: "Anambra",
};

export const previewIdentity = {
  scn: "SCN/2015/041287",
  branch: "NBA Anaocha Branch",
  email: "practitioner@nbaanaocha.org",
} as const;

export const profileStorageKey = "nba-profile-preview-v1";

export function parsePreviewProfile(raw: string | null): PreviewProfile {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return previewProfile;
    const candidate = value as Partial<PreviewProfile>;
    if (typeof candidate.fullName !== "string" || typeof candidate.phone !== "string" || typeof candidate.practiceState !== "string") return previewProfile;
    return { fullName: candidate.fullName, phone: candidate.phone, practiceState: candidate.practiceState };
  } catch {
    return previewProfile;
  }
}
