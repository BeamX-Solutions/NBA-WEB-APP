import { AppShell } from "@/components/mobile/app-shell";
import { ProfileLoadError } from "@/components/profile/profile-load-error";
import { ProfileSecurity } from "@/components/profile/profile-security";
import { loadProfilePageData } from "@/lib/profile/data";

export default async function Page() {
  const result = await loadProfilePageData("/profile/security");
  return <AppShell>{result.data ? <ProfileSecurity account={result.data.account}/> : <ProfileLoadError message={result.error}/>}</AppShell>;
}
