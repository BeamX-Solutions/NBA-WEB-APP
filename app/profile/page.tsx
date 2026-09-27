import { ProfileOverview } from "@/components/profile/profile-overview";
import { ProfileLoadError } from "@/components/profile/profile-load-error";
import { loadProfilePageData } from "@/lib/profile/data";

export default async function Page() {
  const result = await loadProfilePageData("/profile");
  if (!result.data) return <ProfileLoadError message={result.error}/>;
  return <ProfileOverview profile={result.data.profile} subscription={result.data.subscription}/>;
}
