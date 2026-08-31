import { db, distrosTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./session";

export async function seedRepository(): Promise<void> {
  const existingUsers = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  if (existingUsers.length === 0) {
    await db.insert(usersTable).values([
      { username: "admin", passwordHash: hashPassword("admin123"), role: "admin" },
      { username: "user", passwordHash: hashPassword("user123"), role: "user" },
    ]);
  }

  const existingDistros = await db.select({ id: distrosTable.id }).from(distrosTable).limit(1);
  if (existingDistros.length === 0) {
    await db.insert(distrosTable).values([
      {
        name: "CachyOS",
        base: "Arch Linux",
        kernel: "Linux 6.16",
        status: "Active",
        image: null,
        notes: "Performance-focused desktop distribution with tuned defaults and a friendly graphical experience.",
      },
      {
        name: "Fedora Workstation",
        base: "Fedora",
        kernel: "Linux 6.15",
        status: "Active",
        image: null,
        notes: "A polished, forward-looking workstation for developers and creators.",
      },
      {
        name: "NixOS Unstable",
        base: "Independent",
        kernel: "Linux 6.16",
        status: "Development",
        image: null,
        notes: "Declarative system configuration with reproducible environments.",
      },
      {
        name: "Ubuntu 20.04 LTS",
        base: "Debian",
        kernel: "Linux 5.15",
        status: "Legacy",
        image: null,
        notes: "A well-known long-term support release retained for compatibility reference.",
      },
    ]);
  }
}

export async function findUser(username: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
  return user;
}