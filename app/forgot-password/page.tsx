import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ auth_error?: string }> }) {
  const { auth_error } = await searchParams;
  return <ForgotPasswordForm initialError={auth_error === "link" ? "This reset link is invalid or expired. Request a new one." : ""} />;
}
