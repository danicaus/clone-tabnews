import { version as uuidVersion } from "uuid";

import activation from "models/activation.js";
import user from "models/user.js";
import orchestrator from "tests/integration/orchestrator";

describe("PATCH /api/v1/activations/[activation_id]", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
    await orchestrator.deleteAllEmails();
  });

  beforeEach(async () => {
    await orchestrator.clearUserTable();
    await orchestrator.clearSessionTable();
  });

  describe("Anonymous user", () => {
    test("With nonexisten token", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/activations/4172daa2-c5f1-46d9-a296-f80d1476e9f4`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: `Faça um novo cadastro.`,
        status_code: 404,
      });
    });

    test("With used token", async () => {
      const user = await orchestrator.createUser();
      const token = await orchestrator.createActivationToken(user);
      await orchestrator.activateToken(token.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: `Faça um novo cadastro.`,
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.TOKEN_EXPIRATION_IN_MILISSECONDS),
      });
      const user = await orchestrator.createUser();
      const expiredToken = await orchestrator.createActivationToken(user);

      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: `Faça um novo cadastro.`,
        status_code: 404,
      });
    });

    test("Without read:activation_token permission", async () => {
      const user = await orchestrator.createUser();
      await orchestrator.setUserFeatures(user.id, ["read:session"]);
      const token = await orchestrator.createActivationToken(user);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode mais utilizar tokens de ativação.",
        action: `Entre em contato com o suporte.`,
        status_code: 403,
      });
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser();
      const token = await orchestrator.createActivationToken(createdUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: token.id,
        created_at: token.created_at.toISOString(),
        expires_at: token.expires_at.toISOString(),
        used_at: responseBody.used_at,
        user_id: createdUser.id,
        updated_at: responseBody.used_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      // é bem possível desse teste aqui quebrar em algum momento no CI - teste flake
      expect(expiresAt - createdAt).toBe(
        activation.TOKEN_EXPIRATION_IN_MILISSECONDS,
      );

      const activatedUser = await user.findOneById(createdUser.id);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
      ]);
    });
  });

  describe("Default user", () => {
    test("With used token", async () => {
      const user = await orchestrator.createUser();
      const sessionObject = await orchestrator.createSession(user);
      const token = await orchestrator.createActivationToken(user);

      await orchestrator.activateToken(token.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação",
        action: `Verifique se o seu usuário possui a feature "read:activation_token"`,
        status_code: 403,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.TOKEN_EXPIRATION_IN_MILISSECONDS),
      });
      const user = await orchestrator.createUser();
      const token = await orchestrator.createActivationToken(user);

      jest.useRealTimers();

      const sessionObject = await orchestrator.createSession(user);
      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: `Faça um novo cadastro.`,
        status_code: 404,
      });
    });

    test("With valid token, but already logged user", async () => {
      const loggedUser = await orchestrator.createUser();
      await orchestrator.activateUser(loggedUser);
      const loggedUserSessionObject =
        await orchestrator.createSession(loggedUser);

      const newUser = await orchestrator.createUser();
      const newUserActivationToken =
        await orchestrator.createActivationToken(newUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${newUserActivationToken}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${loggedUserSessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação",
        action: `Verifique se o seu usuário possui a feature "read:activation_token"`,
        status_code: 403,
      });
    });

    test("With valid token", async () => {
      const user = await orchestrator.createUser();
      const sessionObject = await orchestrator.createSession(user);
      const token = await orchestrator.createActivationToken(user);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: token.id,
        created_at: token.created_at.toISOString(),
        expires_at: token.expires_at.toISOString(),
        used_at: responseBody.used_at,
        user_id: user.id,
        updated_at: responseBody.used_at,
      });
    });
  });
});
