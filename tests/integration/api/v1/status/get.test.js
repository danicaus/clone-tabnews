import orchestrator from "tests/integration/orchestrator.js";

describe("GET /api/v1/status", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
  });
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const receivedUpdatedAt = responseBody.updated_at;
      const parsedUpdateAt = new Date(receivedUpdatedAt).toISOString();
      expect(receivedUpdatedAt).toBe(parsedUpdateAt);

      const { database } = responseBody.dependencies;
      expect(database.max_connections).toBe(100);
      expect(database.opened_connections).toBe(1);
      expect(database).not.toHaveProperty("version");
    });
  });

  describe("Default user", () => {
    test("Retrieving current system status", async () => {
      const createdUser = await orchestrator.createUser();
      const userObject = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(userObject);

      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const receivedUpdatedAt = responseBody.updated_at;
      const parsedUpdateAt = new Date(receivedUpdatedAt).toISOString();
      expect(receivedUpdatedAt).toBe(parsedUpdateAt);

      const { database } = responseBody.dependencies;
      expect(database.max_connections).toBe(100);
      expect(database.opened_connections).toBe(1);
      expect(database).not.toHaveProperty("version");
    });
  });

  describe("Privileged user", () => {
    test("Retrieving current system status", async () => {
      const createdUser = await orchestrator.createUser();
      const userObject = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(userObject);
      await orchestrator.addFeaturesToUser(userObject, ["read:statusPage:all"]);

      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const receivedUpdatedAt = responseBody.updated_at;
      const parsedUpdateAt = new Date(receivedUpdatedAt).toISOString();
      expect(receivedUpdatedAt).toBe(parsedUpdateAt);

      const { database } = responseBody.dependencies;
      expect(database.version).toBe("16.0");
      expect(database.max_connections).toBe(100);
      expect(database.opened_connections).toBe(1);
    });
  });
});
