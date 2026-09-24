import type { SupabaseClient } from "@supabase/supabase-js";

export type SignupBranch = {
  id: string;
  branch_code: string;
  name: string;
  state: string | null;
};

function isSignupBranch(value: unknown): value is SignupBranch {
  if (!value || typeof value !== "object") return false;
  const branch = value as Record<string, unknown>;
  return (
    (typeof branch.id === "string" || typeof branch.id === "number") &&
    typeof branch.branch_code === "string" &&
    branch.branch_code.length > 0 &&
    typeof branch.name === "string" &&
    (branch.state === null || typeof branch.state === "string")
  );
}

export async function listSignupBranches(client: SupabaseClient): Promise<SignupBranch[]> {
  const { data, error } = await client.rpc("list_branches_for_signup");
  if (error) throw error;
  if (!Array.isArray(data) || !data.every(isSignupBranch)) {
    throw new Error("The branch list has an unexpected format.");
  }
  return data.map((branch) => ({ ...branch, id: String(branch.id) }));
}
