import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  log: [{ emit: "event", level: "query" }],
});

const queries: string[] = [];
prisma.$on("query", (event) => queries.push(event.query));

const select = {
  id: true,
  title: true,
  price: true,
  location: { select: { name: true } },
  category: { select: { name: true } },
  user: { select: { name: true } },
  images: { where: { isPrimary: true }, select: { filePath: true }, take: 1 },
} as const;

const where = {
  status: "ACTIVE",
  user: { status: "ACTIVE" },
  price: { gte: 100000, lte: 20000000 },
} as const;

async function run(strategy: "join" | "query") {
  queries.length = 0;
  const started = performance.now();

  const rows = await prisma.advertisement.findMany({
    relationLoadStrategy: strategy,
    where,
    select,
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const elapsed = performance.now() - started;
  return { strategy, rows: rows.length, statements: queries.length, ms: elapsed };
}

async function main() {
  await prisma.advertisement.count();

  const results = [await run("join"), await run("query")];

  console.log("\nSame query, five tables (Advertisement, User, Category, Location, AdImage)\n");
  console.table(
    results.map((r) => ({
      "relationLoadStrategy": r.strategy,
      "rows returned": r.rows,
      "SQL statements": r.statements,
      "elapsed (ms)": r.ms.toFixed(1),
    })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
