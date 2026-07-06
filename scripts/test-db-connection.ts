import { PrismaClient } from "@prisma/client";
import { ensureDatabaseReady } from "../lib/utils/db-retry";

async function main(): Promise<void> {
  console.log("Pinging Neon PostgreSQL…");
  await ensureDatabaseReady();

  const prisma = new PrismaClient();
  const count = await prisma.coiVersion.count();
  console.log(`Database connection OK (${count} COI version(s) in database)`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Database connection failed:", error);
  process.exit(1);
});
