import { ProfileSecurity } from "@/components/profile/profile-security";
import { ProfileLoadError } from "@/components/profile/profile-load-error";
import { loadProfilePageData } from "@/lib/profile/data";

export default async function Page() {
  const result = await loadProfilePageData("/profile/security");
  if (!result.data) return <ProfileLoadError message={result.error} />;
  return <ProfileSecurity account={result.data.account} />;
}
