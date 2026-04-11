import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database.js";
import { ServiceError } from "infra/errors";

async function migrationsHandler(dryRun) {
  const dbClient = await database.getNewClient();

  const defaultMigrationConfig = {
    dbClient: dbClient,
    dryRun,
    dir: resolve("infra", "migrations"),
    direction: "up",
    log: () => {},
    migrationsTable: "pgmigrations",
  };

  try {
    return await migrationRunner(defaultMigrationConfig);
  } catch (error) {
    throw new ServiceError({
      message: "Erro na conexão com o Banco de Dados ou Migration",
      cause: error,
    });
  } finally {
    await dbClient.end();
  }
}

async function listPendingMigrations() {
  return await migrationsHandler(true);
}

async function runPendingMigrations() {
  return await migrationsHandler(false);
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
