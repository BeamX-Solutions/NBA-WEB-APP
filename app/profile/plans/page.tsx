import { ProfilePlans } from "@/components/profile/profile-plans";
import { ProfileLoadError } from "@/components/profile/profile-load-error";
import { loadProfilePageData } from "@/lib/profile/data";

export default async function Page() {
  const result = await loadProfilePageData("/profile/plans");
  if (!result.data) return <ProfileLoadError message={result.error} />;
  return <ProfilePlans branchName={result.data.profile.branchName} subscription={result.data.subscription} />;
}
