import { createRouter } from "next-connect";
import database from "infra/database";
import controller from "infra/controller";
import authorization from "models/authorization";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();
  const databaseVersionResult = await database.query("SHOW server_version;");
  const databaseVersionValue = databaseVersionResult.rows[0].server_version;

  const databaseMaxConnectionResult = await database.query(
    "SHOW max_connections;",
  );
  const databaseMaxConnectionsValue =
    databaseMaxConnectionResult.rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;
  const databaseOpenedConnectionsQuery =
    "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1;";
  const databaseOpenedConnectionsResult = await database.query({
    text: databaseOpenedConnectionsQuery,
    values: [databaseName],
  });
  const databaseOpenedConnectionsValue =
    databaseOpenedConnectionsResult.rows[0].count;

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: parseInt(databaseMaxConnectionsValue),
        opened_connections: databaseOpenedConnectionsValue,
      },
    },
  };

  const userTryingToGet = request.context.user;

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:statusPage",
    statusObject,
  );

  response.status(200).json(secureOutputValues);
}
