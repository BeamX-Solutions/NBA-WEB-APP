import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ auth_error?: string }> }) {
  const { auth_error } = await searchParams;
  return <LoginForm initialError={auth_error === "link" ? "This sign-in link is invalid or expired. Please try again." : ""} />;
}
