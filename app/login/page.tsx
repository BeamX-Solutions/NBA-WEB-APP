import { LoginForm } from "@/components/auth/login-form";
import { Onboarding } from "@/components/onboarding/onboarding";
import { ADMINISTRATOR_REJECTION } from "@/lib/practitioner/access";

const authErrors: Record<string, string> = {
  link: "This sign-in link is invalid or expired. Please try again.",
  administrator: ADMINISTRATOR_REJECTION,
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ auth_error?: string; auth_notice?: string }> }) {
  const { auth_error, auth_notice } = await searchParams;
  return <>
    <LoginForm
      initialError={auth_error && Object.hasOwn(authErrors, auth_error) ? authErrors[auth_error] : ""}
      initialSuccess={auth_notice === "password-updated" ? "Password updated. Log in with your new password." : ""}
    />
    {/* First-visit onboarding adapts to mobile, tablet, and desktop screens. */}
    <Onboarding/>
  </>;
}
