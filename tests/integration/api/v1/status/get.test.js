/**
 * @jest-environment node
 */
import orchestrator from "tests/integration/orchestrator.js";

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    let response;
    let responseBody;

    beforeAll(async () => {
      await orchestrator.waitForAllServices();
    });

    beforeEach(async () => {
      response = await fetch("http://localhost:3000/api/v1/status");
      responseBody = await response.json();
    });

    test("Retrieving current system status", () => {
      expect(response.status).toBe(200);

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
