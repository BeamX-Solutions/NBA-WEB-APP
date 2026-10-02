import { ProfileLoadError } from "@/components/profile/profile-load-error";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { loadProfilePageData } from "@/lib/profile/data";

export default async function Page() {
  const result = await loadProfilePageData("/profile");
  return <>{result.data ? <ProfileOverview profile={result.data.profile} subscription={result.data.subscription}/> : <ProfileLoadError message={result.error}/>}</>;
}
