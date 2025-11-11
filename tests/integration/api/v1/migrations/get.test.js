/**
 * @jest-environment node
 */

import orchestrator from "tests/integration/orchestrator.js";

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    let response;
    let responseBody;

    beforeAll(async () => {
      await orchestrator.waitForAllServices();
      await orchestrator.clearDatabase();
    });

    beforeEach(async () => {
      response = await fetch("http://localhost:3000/api/v1/migrations");
      responseBody = await response.json();
    });

    test("Getting pending migrations", () => {
      expect(response.status).toBe(200);
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });
});
