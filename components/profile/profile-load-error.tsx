import { FormNotice } from "@/components/ui/form-notice";
import { ProfileFrame, ProfileHeading } from "@/components/profile/profile-ui";

export function ProfileLoadError({ message }: { message: string }) {
  return <ProfileFrame navigation><ProfileHeading description="We could not show your account details." title="Profile"/><div className="mx-auto max-w-[760px]"><FormNotice tone="error">{message}</FormNotice></div></ProfileFrame>;
}

