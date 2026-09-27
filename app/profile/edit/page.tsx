import { ProfileEdit } from "@/components/profile/profile-edit";
import { ProfileLoadError } from "@/components/profile/profile-load-error";
import { loadProfilePageData } from "@/lib/profile/data";

export default async function Page() {
  const result = await loadProfilePageData("/profile/edit");
  if (!result.data) return <ProfileLoadError message={result.error}/>;
  return <ProfileEdit profile={result.data.profile}/>;
}
