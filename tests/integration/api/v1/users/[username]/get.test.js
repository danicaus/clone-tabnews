import orchestrator from "tests/integration/orchestrator.js";

describe("GET /api/v1/user/[username]", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
  });

  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      await orchestrator.createUser({
        username: "SameCase",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/SameCase`,
      );
      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        username: "SameCase",
        features: ["read:activation_token"],
        id: responseBody.id,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("With case mismatch", async () => {
      await orchestrator.createUser({
        username: "CaseMismatch",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/casemismatch",
      );
      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        username: "CaseMismatch",
        features: ["read:activation_token"],
        id: responseBody.id,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("With nonexistent username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexistent",
      );
      expect(response.status).toBe(404);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema",
        action: "Verifique se o username está digitado corretamente",
        status_code: 404,
      });
    });
  });

  describe("Default user", () => {
    test("Consulting their own user", async () => {
      const createdUser = await orchestrator.createUser();
      const userSession = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          headers: {
            Cookie: `session_id=${userSession.token}`,
          },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        username: createdUser.username,
        features: ["read:activation_token"],
        id: responseBody.id,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("Consulting another user", async () => {
      const createdUser = await orchestrator.createUser();
      const userSession = await orchestrator.createSession(createdUser);
      const anotherUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${anotherUser.username}`,
        {
          headers: {
            Cookie: `session_id=${userSession.token}`,
          },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        username: anotherUser.username,
        features: ["read:activation_token"],
        id: responseBody.id,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });
  });
});
