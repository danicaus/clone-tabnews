import { join } from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database.js";

export default async function migrations(req, res) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(req.method)) {
    return res
      .status(405)
      .end()
      .json({
        error: `Method ${req.method} Not Allowed`,
      });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const defaultMigrationConfig = {
      dbClient: dbClient,
      dryRun: true,
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };
    if (req.method === "GET") {
      const pendingMigrations = await migrationRunner(defaultMigrationConfig);
      return res.status(200).json(pendingMigrations);
    }

    if (req.method === "POST") {
      const migratedMigrations = await migrationRunner({
        ...defaultMigrationConfig,
        dryRun: false,
      });

      if (migratedMigrations.length > 0) {
        return res.status(201).json(migratedMigrations);
      }

      return res.status(200).json(migratedMigrations);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await dbClient.end();
  }
}
