import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database.js";
import { createRouter } from "next-connect";
import controller from "infra/controller";

const router = createRouter();
router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const dbClient = await database.getNewClient();
  try {
    const pendingMigrations = await migrationsHandler(true, dbClient);
    return response.status(200).json(pendingMigrations);
  } finally {
    await dbClient.end();
  }
}

async function postHandler(request, response) {
  const dbClient = await database.getNewClient();

  try {
    const migratedMigrations = await migrationsHandler(false, dbClient);
    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }
    return response.status(200).json(migratedMigrations);
  } finally {
    dbClient.end();
  }
}

async function migrationsHandler(dryRun = true, dbClient) {
  const defaultMigrationConfig = {
    dbClient: dbClient,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  return await migrationRunner({ ...defaultMigrationConfig, dryRun });
}
