import orchestrator from "tests/integration/orchestrator.js";

describe("POST /api/v1/migrations", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runFirstMigrations();
  });

  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
      });
      expect(response.status).toBe(403);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action:
          'Verifique se o seu usuário possui a feature "update:migration"',
        message: "Você não possui permissão para executar esta ação",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const userObject = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(userObject);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(403);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action:
          'Verifique se o seu usuário possui a feature "update:migration"',
        message: "Você não possui permissão para executar esta ação",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    describe("Retrieving pending migrations", () => {
      let response, responseBody, sessionObject;

      beforeAll(async () => {
        const createdUser = await orchestrator.createUser();
        const userObject = await orchestrator.activateUser(createdUser);
        sessionObject = await orchestrator.createSession(createdUser);
        await orchestrator.addFeaturesToUser(userObject, ["update:migration"]);
      });

      beforeEach(async () => {
        response = await fetch("http://localhost:3000/api/v1/migrations", {
          method: "POST",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        });
        responseBody = await response.json();
      });

      test("For the first time", () => {
        expect(response.status).toBe(201);
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(0);
      });

      test("For the second time", () => {
        expect(response.status).toBe(200);
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBe(0);
      });
    });
  });
});
