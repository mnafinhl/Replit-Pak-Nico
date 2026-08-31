import { Router, type IRouter } from "express";
import {
  GetCurrentSessionResponse,
  LoginBody,
  LoginResponse,
} from "@workspace/api-zod";
import {
  clearSession,
  currentUser,
  requireSession,
  setSession,
  verifyPassword,
} from "../lib/session";
import { findUser } from "../lib/repository";

const router: IRouter = Router();

function publicUser(user: { id: number; username: string; role: string }) {
  return { id: user.id, username: user.username, role: user.role };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a username and password." });
    return;
  }
  const user = await findUser(parsed.data.username.trim());
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }
  setSession(res, user.id);
  res.json(LoginResponse.parse({ user: publicUser(user) }));
});

router.post("/auth/logout", (req, res): void => {
  clearSession(req, res);
  res.sendStatus(204);
});

router.get("/auth/me", requireSession, (req, res): void => {
  const user = req.repoUser;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.json(GetCurrentSessionResponse.parse({ user: publicUser(user) }));
});

export default router;