import crypto from "crypto";

export function generatePkce() {
  const code_verifier  = crypto.randomBytes(48).toString("base64url").slice(0, 128);
  const code_challenge = crypto
    .createHash("sha256")
    .update(code_verifier)
    .digest("base64url");

  return { code_verifier, code_challenge };
}

export function generateState() {
  return crypto.randomBytes(24).toString("hex");
}
