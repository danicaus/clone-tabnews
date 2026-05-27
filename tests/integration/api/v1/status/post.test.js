import webServer from "infra/webserver";
import orchestrator from "tests/integration/orchestrator.js";

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    let response;

    beforeAll(async () => {
      await orchestrator.waitForAllServices();
      await orchestrator.clearDatabase();
      await orchestrator.runPendingMigrations();
    });

    beforeEach(async () => {
      response = await fetch(`${webServer.origin}/api/v1/status`, {
        method: "POST",
      });
    });

    test("Retrieving current system status", async () => {
      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "Método não permitido para este endpoint.",
        action:
          "Verifique se o método HTTP enviado é válido para este endpoint.",
        status_code: 405,
      });
    });
  });
});
