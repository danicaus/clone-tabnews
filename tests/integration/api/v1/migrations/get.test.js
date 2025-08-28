/**
 * @jest-environment node
 */

import orchestrator from "tests/integration/orchestrator.js";
import database from "infra/database";

describe("GET to /api/v1/migrations", () => {
  let response;
  let responseBody;

  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await database.query("drop schema public cascade; create schema public;");
  });

  beforeEach(async () => {
    response = await fetch("http://localhost:3000/api/v1/migrations");
    responseBody = await response.json();
  });

  test("SHOULD return 200", () => {
    expect(response.status).toBe(200);
  });

  test("SHOULD return an array", () => {
    expect(Array.isArray(responseBody)).toBe(true);
  });

  test("SHOULD return an array with at least one object", () => {
    expect(responseBody.length).toBeGreaterThan(0);
  });
});
