// migrate.ts
import { Umzug, SequelizeStorage } from "umzug";
import { db } from "@/lib/db";
import path from "path";
import { logger } from "@/lib/logger";
import { config } from "@/lib/config";

export async function runMigrations() {
  const umzug = new Umzug({
    migrations: {
      glob: path.join(config.appFolder, "src", "lib", "migrations", "*.ts"),
    },
    context: db.sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: db.sequelize }),
    logger: logger,
  });
  
  logger.info("Running migrations...");
  await umzug.up();
  logger.info("Migrations executed");
}