/**
 * @jest-environment node
 */

import orchestrator from "tests/integration/orchestrator.js";

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Retrieving pending migrations", () => {
      let response;
      let responseBody;

      beforeAll(async () => {
        await orchestrator.waitForAllServices();
        await orchestrator.clearDatabase();
      });

      beforeEach(async () => {
        response = await fetch("http://localhost:3000/api/v1/migrations", {
          method: "POST",
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
