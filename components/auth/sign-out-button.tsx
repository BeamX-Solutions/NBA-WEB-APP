"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/mobile/button";
import { friendlyAuthError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

/** The outline "Sign out" of mobile's MembershipPending and AdminWebOnly screens. */
export function SignOutButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) { setMessage(friendlyAuthError(error, "logout")); return; }
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setMessage(friendlyAuthError(error, "logout"));
    } finally {
      setSigningOut(false);
    }
  }

  return <>
    <Button loading={signingOut} onClick={signOut} variant="outline">Sign out</Button>
    {message ? <p className="mt-2 text-label text-danger" role="alert">{message}</p> : null}
  </>;
}
