import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { GateBody, GateScreen } from "@/components/membership/gate-screen";
import { MembershipStatus } from "@/components/membership/membership-status";
import { listSignupBranches, type SignupBranch } from "@/lib/auth/branches";
import { createClient } from "@/lib/supabase/server";

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function activeBranches(client: Awaited<ReturnType<typeof createClient>>): Promise<SignupBranch[]> {
  try {
    return await listSignupBranches(client);
  } catch {
    // Correcting name, SCN and phone still works without the list; the branch stays as registered.
    return [];
  }
}

export default async function MembershipPage() {
  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) redirect("/login?next=%2Fmembership");

  const [profile, branches] = await Promise.all([
    client.from("profiles").select("full_name, scn, phone, membership_status, membership_rejection_reason").eq("id", user.id).maybeSingle(),
    activeBranches(client),
  ]);
  const status = profile.data?.membership_status;
  if (profile.error || (status !== "pending" && status !== "rejected")) {
    return <GateScreen icon="error-outline" title="Membership unavailable"><GateBody>Your membership status could not be loaded. Refresh the page or sign in again.</GateBody><div className="mt-6"><SignOutButton/></div></GateScreen>;
  }

  return <MembershipStatus details={{
    branches,
    fullName: text(profile.data?.full_name),
    phone: text(profile.data?.phone),
    rejectionReason: text(profile.data?.membership_rejection_reason) || null,
    scn: text(profile.data?.scn),
    status,
  }}/>;
}
