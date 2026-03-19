import crypto from "node:crypto";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";
import type { Request, Response } from "express";
import { apiConfig } from "./config.js";

const COOKIE_NAME = "commonplace-session";

interface SessionPayload {
  email: string | null;
  authenticatedSlugs: string[];
  expiresAt: string;
}

const emptySession: SessionPayload = {
  email: null,
  authenticatedSlugs: [],
  expiresAt: new Date(0).toISOString()
};

function sign(value: string): string {
  return crypto
    .createHmac("sha256", apiConfig.sessionSecret)
    .update(value)
    .digest("base64url");
}

function encodeSession(session: SessionPayload): string {
  const value = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${value}.${sign(value)}`;
}

function decodeSession(raw: string | undefined): SessionPayload {
  if (!raw) {
    return emptySession;
  }

  const [value, signature] = raw.split(".");
  if (!value || !signature) {
    return emptySession;
  }
  const expected = sign(value);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return emptySession;
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
    return {
      email: parsed.email ?? null,
      authenticatedSlugs: Array.isArray(parsed.authenticatedSlugs) ? parsed.authenticatedSlugs : [],
      expiresAt: typeof parsed.expiresAt === "string" ? parsed.expiresAt : new Date(0).toISOString()
    };
  } catch {
    return emptySession;
  }
}

export function readSession(req: Request): SessionPayload {
  const cookies = parseCookie(req.headers.cookie ?? "");
  const session = decodeSession(cookies[COOKIE_NAME]);
  if (Date.parse(session.expiresAt) <= Date.now()) {
    return emptySession;
  }
  return session;
}

export function writeSession(
  res: Response,
  session: Omit<SessionPayload, "expiresAt">,
) {
  const maxAgeSeconds = apiConfig.sessionMaxAgeDays * 24 * 60 * 60;
  const payload: SessionPayload = {
    ...session,
    expiresAt: new Date(Date.now() + maxAgeSeconds * 1000).toISOString()
  };
  res.append(
    "Set-Cookie",
    serializeCookie(COOKIE_NAME, encodeSession(payload), {
      httpOnly: true,
      path: "/",
      sameSite: apiConfig.cookieSameSite,
      secure: apiConfig.cookieSameSite === "none",
      domain: apiConfig.cookieDomain,
      maxAge: maxAgeSeconds
    })
  );
}
