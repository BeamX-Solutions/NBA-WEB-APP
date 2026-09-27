import { ProfileHelp } from "@/components/profile/profile-help";
import { ProfileLoadError } from "@/components/profile/profile-load-error";
import { loadProfilePageData } from "@/lib/profile/data";

export default async function Page() {
  const result = await loadProfilePageData("/profile/help");
  if (!result.data) return <ProfileLoadError message={result.error} />;
  return <ProfileHelp branchName={result.data.profile.branchName} />;
}
