import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "repo_session";
const sessions = new Map<string, number>();

function secret(): string {
  return process.env.SESSION_SECRET ?? "linux-repo-development-secret";
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    actual.length === expectedBuffer.length &&
    timingSafeEqual(actual, expectedBuffer)
  );
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function token(): string {
  const value = randomBytes(24).toString("hex");
  return `${value}.${sign(value)}`;
}

function validToken(value: string): boolean {
  const [raw, signature] = value.split(".");
  if (!raw || !signature) return false;
  const expected = sign(raw);
  return (
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
}

export function setSession(res: Response, userId: number): void {
  const value = token();
  sessions.set(value, userId);
  res.cookie(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8,
  });
}

export function clearSession(req: Request, res: Response): void {
  const value = req.cookies?.[SESSION_COOKIE];
  if (value) sessions.delete(value);
  res.clearCookie(SESSION_COOKIE);
}

export async function currentUser(req: Request) {
  const value = req.cookies?.[SESSION_COOKIE];
  if (!value || !validToken(value)) return undefined;
  const userId = sessions.get(value);
  if (!userId) return undefined;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return user;
}

export function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void currentUser(req)
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      req.repoUser = user;
      next();
    })
    .catch(next);
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.repoUser?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

declare global {
  namespace Express {
    interface Request {
      repoUser?: Awaited<ReturnType<typeof currentUser>>;
    }
  }
}