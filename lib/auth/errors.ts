export type AuthOperation =
  | "login"
  | "register"
  | "request-reset"
  | "reset-password"
  | "change-password"
  | "logout";

type AuthErrorShape = {
  code?: unknown;
  message?: unknown;
  status?: unknown;
};

const rateLimitCodes = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "rate_limit_exceeded",
]);

function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const code = (error as AuthErrorShape).code;
  return typeof code === "string" ? code.toLowerCase() : "";
}

function errorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const message = (error as AuthErrorShape).message;
  return typeof message === "string" ? message.toLowerCase() : "";
}

export function friendlyAuthError(error: unknown, operation: AuthOperation): string {
  const code = errorCode(error);
  const message = errorMessage(error);

  if (rateLimitCodes.has(code) || message.includes("rate limit")) {
    return "Too many attempts were made. Wait a few minutes, then try again.";
  }

  if (operation === "login") {
    if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
      return "The email address or password is incorrect.";
    }
    if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
      return "Confirm your email address before logging in.";
    }
    return "Log in could not be completed. Check your connection and try again.";
  }

  if (operation === "register") {
    if (
      code === "user_already_exists" ||
      code === "email_exists" ||
      message.includes("already registered") ||
      message.includes("already exists") ||
      message.includes("duplicate key")
    ) {
      return "An account already uses this email address or Supreme Court Number.";
    }
    if (code === "weak_password" || message.includes("password should") || message.includes("weak password")) {
      return "Choose a stronger password with at least 8 characters.";
    }
    return "Registration could not be completed. The email address or Supreme Court Number may already be registered.";
  }

  if (operation === "request-reset") {
    return "The reset request could not be sent. Wait a moment and try again.";
  }

  if (operation === "reset-password") {
    if (
      code === "session_not_found" ||
      code === "otp_expired" ||
      code === "bad_code_verifier" ||
      message.includes("session") ||
      message.includes("expired")
    ) {
      return "This reset link is invalid or expired. Request a new one.";
    }
    if (code === "weak_password" || message.includes("password should") || message.includes("weak password")) {
      return "Choose a stronger password with at least 8 characters.";
    }
    if (code === "same_password" || message.includes("same password")) {
      return "Choose a password you have not used for this account.";
    }
    return "The password could not be updated. Request a new link and try again.";
  }

  if (operation === "change-password") {
    if (code === "invalid_credentials" || message.includes("current password")) {
      return "The current password is incorrect.";
    }
    if (code === "weak_password" || message.includes("password should") || message.includes("weak password")) {
      return "Choose a stronger password with at least 8 characters.";
    }
    if (code === "same_password" || message.includes("same password")) {
      return "Choose a password you have not used for this account.";
    }
    return "The password could not be updated. Check your details and try again.";
  }

  return "Could not log out. Check your connection and try again.";
}
