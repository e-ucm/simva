// migrate.ts
import { Umzug, SequelizeStorage } from "umzug";
import { db } from "@/lib/db";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "@/lib/logger";

// Resolve the migrations relative to this file so the same code works from
// source (`src/lib/migrate.ts`, run with tsx) and from the compiled output
// (`dist/lib/migrate.js`, run with node). Loading `.ts` under plain node would
// fail, so both extensions are matched and the runnable one is picked up.
const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

export async function runMigrations() {
  const umzug = new Umzug({
    migrations: {
      glob: path.join(migrationsFolder, "*.{ts,js}"),
    },
    context: db.sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: db.sequelize }),
    logger: logger,
  });
  
  logger.info("Running migrations...");
  await umzug.up();
  logger.info("Migrations executed");
}