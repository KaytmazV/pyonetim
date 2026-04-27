import { createHmac, timingSafeEqual } from "crypto";

export const GOZLEM_COOKIE = "gozlem_session";

export function createGozlemSessionToken(secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  const payload = Buffer.from(JSON.stringify({ v: 1, exp })).toString(
    "base64url"
  );
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyGozlemSessionToken(
  token: string,
  secret: string
): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expectedSig, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  try {
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { v?: number; exp?: number };
    if (json.v !== 1 || typeof json.exp !== "number") return false;
    if (Math.floor(Date.now() / 1000) >= json.exp) return false;
    return true;
  } catch {
    return false;
  }
}
