import orchestrator from "tests/integration/orchestrator.js";

describe("GET /api/v1/migrations", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runFirstMigrations();
  });

  describe("Anonymous user", () => {
    test("Getting pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");

      expect(response.status).toBe(403);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action: 'Verifique se o seu usuário possui a feature "read:migration"',
        message: "Você não possui permissão para executar esta ação",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default  user", () => {
    test("Getting pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const userObject = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(userObject);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action: 'Verifique se o seu usuário possui a feature "read:migration"',
        message: "Você não possui permissão para executar esta ação",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Getting pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const userObject = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser);
      await orchestrator.addFeaturesToUser(userObject, ["read:migration"]);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });
});
