import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export type AppRole = "yonetici" | "gozlemci";
type SessionPayload = { u: string; r: AppRole; exp: number; v: 1 };

const COOKIE_NAME = "app_session";

function sign(payloadBase64: string, secret: string) {
  return createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function getSecret() {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error("APP_SESSION_SECRET eksik.");
  return secret;
}

export async function setAppSession(username: string, role: AppRole) {
  const secret = getSecret();
  const payload: SessionPayload = {
    u: username,
    r: role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14,
    v: 1,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${body}.${sign(body, secret)}`;

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearAppSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAppSession(): Promise<{
  username: string;
  role: AppRole;
} | null> {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return null;

  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = sign(body, secret);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SessionPayload;
    if (payload.v !== 1 || !payload.u || !payload.r || !payload.exp) return null;
    if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return { username: payload.u, role: payload.r };
  } catch {
    return null;
  }
}

export function resolveCredential(username: string, password: string): AppRole | null {
  if (
    username === process.env.APP_YONETICI_ID &&
    password === process.env.APP_YONETICI_PASSWORD
  ) {
    return "yonetici";
  }
  if (
    username === process.env.APP_GOZLEMCI_ID &&
    password === process.env.APP_GOZLEMCI_PASSWORD
  ) {
    return "gozlemci";
  }
  return null;
}
