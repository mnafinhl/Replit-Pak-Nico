import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const distrosTable = pgTable("linux_repo_distros", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  base: text("base").notNull(),
  kernel: text("kernel").notNull(),
  status: text("status").notNull().default("Active"),
  image: text("image"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDistroSchema = createInsertSchema(distrosTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDistro = z.infer<typeof insertDistroSchema>;
export type Distro = typeof distrosTable.$inferSelect;