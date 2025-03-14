import database from "infra/database";

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

describe("POST to /api/v1/migrations", () => {
  let response;
  let responseBody;

  beforeAll(async () => {
    await cleanDatabase();
  });

  beforeEach(async () => {
    response = await fetch("http://localhost:3000/api/v1/migrations", {
      method: "POST",
    });
    responseBody = await response.json();
  });

  test("SHOULD return 201", () => {
    expect(response.status).toBe(201);
  });

  test("SHOULD return 200", () => {
    expect(response.status).toBe(200);
  });

  test("SHOULD return an array", () => {
    expect(Array.isArray(responseBody)).toBe(true);
  });
});
