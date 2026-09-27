import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ auth_error?: string; auth_notice?: string }> }) {
  const { auth_error, auth_notice } = await searchParams;
  return (
    <LoginForm
      initialError={auth_error === "link" ? "This sign-in link is invalid or expired. Please try again." : ""}
      initialSuccess={auth_notice === "password-updated" ? "Password updated. Log in with your new password." : ""}
    />
  );
}
