import user from "models/user.js";
import orchestrator from "tests/integration/orchestrator.js";

describe("GET /api/v1/user/[username]", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
  });

  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      await user.create({
        username: "ExactMatch",
        email: "exact_match@email.com",
        password: "senha123",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/ExactMatch",
      );
      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        username: "ExactMatch",
        email: "exact_match@email.com",
        password: responseBody.password,
        id: responseBody.id,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("With case mismatch", async () => {
      await user.create({
        username: "CaseMismatch",
        email: "case_mismatch@email.com",
        password: "senha123",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/casemismatch",
      );
      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        username: "CaseMismatch",
        email: "case_mismatch@email.com",
        password: responseBody.password,
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
});
