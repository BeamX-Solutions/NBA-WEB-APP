import { ProfileSecurity } from "@/components/profile/profile-security";
import { loadAccount } from "@/lib/profile/data";

export default async function Page() {
  return <ProfileSecurity account={await loadAccount()}/>;
}
