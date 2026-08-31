import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  CreateDistroBody,
  CreateDistroResponse,
  DeleteDistroParams,
  GetDistroParams,
  GetDistroResponse,
  GetDashboardSummaryResponse,
  ListDistrosQueryParams,
  ListDistrosResponse,
  UpdateDistroBody,
  UpdateDistroParams,
  UpdateDistroResponse,
} from "@workspace/api-zod";
import { db, distrosTable } from "@workspace/db";
import { requireAdmin, requireSession } from "../lib/session";

const router: IRouter = Router();
const statuses = ["Development", "Active", "Legacy"] as const;

function serializeDistro(distro: typeof distrosTable.$inferSelect) {
  return {
    ...distro,
    image: distro.image ?? null,
    createdAt: distro.createdAt.toISOString(),
  };
}

router.get("/distros", requireSession, async (req, res): Promise<void> => {
  const parsed = ListDistrosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const conditions = [];
  if (parsed.data.search) {
    const term = `%${parsed.data.search}%`;
    conditions.push(
      or(
        ilike(distrosTable.name, term),
        ilike(distrosTable.base, term),
        ilike(distrosTable.kernel, term),
      ),
    );
  }
  if (parsed.data.status) conditions.push(eq(distrosTable.status, parsed.data.status));
  const distros = await db
    .select()
    .from(distrosTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(distrosTable.createdAt));
  res.json(ListDistrosResponse.parse(distros.map(serializeDistro)));
});

router.get("/distros/:id", requireSession, async (req, res): Promise<void> => {
  const params = GetDistroParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [distro] = await db
    .select()
    .from(distrosTable)
    .where(eq(distrosTable.id, params.data.id))
    .limit(1);
  if (!distro) {
    res.status(404).json({ error: "Distribution not found." });
    return;
  }
  res.json(GetDistroResponse.parse(serializeDistro(distro)));
});

router.post("/distros", requireSession, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateDistroBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [distro] = await db.insert(distrosTable).values(parsed.data).returning();
  res.status(201).json(CreateDistroResponse.parse(serializeDistro(distro)));
});

router.patch("/distros/:id", requireSession, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateDistroParams.safeParse(req.params);
  const body = UpdateDistroBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid distro update." });
    return;
  }
  const [distro] = await db
    .update(distrosTable)
    .set(body.data)
    .where(eq(distrosTable.id, params.data.id))
    .returning();
  if (!distro) {
    res.status(404).json({ error: "Distribution not found." });
    return;
  }
  res.json(UpdateDistroResponse.parse(serializeDistro(distro)));
});

router.delete("/distros/:id", requireSession, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteDistroParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [distro] = await db
    .delete(distrosTable)
    .where(eq(distrosTable.id, params.data.id))
    .returning();
  if (!distro) {
    res.status(404).json({ error: "Distribution not found." });
    return;
  }
  res.sendStatus(204);
});

router.get("/dashboard/summary", requireSession, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      status: distrosTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(distrosTable)
    .groupBy(distrosTable.status);
  const latest = await db
    .select()
    .from(distrosTable)
    .orderBy(desc(distrosTable.createdAt))
    .limit(3);
  const count = (status: (typeof statuses)[number]) =>
    rows.find((row) => row.status === status)?.count ?? 0;
  const result = {
    total: rows.reduce((sum, row) => sum + Number(row.count), 0),
    active: count("Active"),
    development: count("Development"),
    legacy: count("Legacy"),
    latest: latest.map(serializeDistro),
  };
  res.json(GetDashboardSummaryResponse.parse(result));
});

export default router;