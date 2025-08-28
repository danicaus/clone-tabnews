/**
 * @jest-environment node
 */

import orchestrator from "tests/integration/orchestrator.js";
import database from "infra/database";

describe("POST to /api/v1/migrations", () => {
  let response;
  let responseBody;

  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await database.query("drop schema public cascade; create schema public;");
  });

  beforeEach(async () => {
    response = await fetch("http://localhost:3000/api/v1/migrations", {
      method: "POST",
    });
    responseBody = await response.json();
  });

  test("SHOULD return 201 with an array with more than one element at first", () => {
    expect(response.status).toBe(201);
    expect(Array.isArray(responseBody)).toBe(true);
    expect(responseBody.length).toBeGreaterThan(0);
  });

  test("SHOULD return 200 with a empty array from second request", () => {
    expect(response.status).toBe(200);
    expect(Array.isArray(responseBody)).toBe(true);
    expect(responseBody.length).toBe(0);
  });
});
