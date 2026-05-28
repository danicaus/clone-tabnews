import { version as uuidVersion } from "uuid";
import orchestrator from "tests/integration/orchestrator.js";
import session from "models/session.js";
import setCookieParser from "set-cookie-parser";
import webServer from "infra/webserver";

describe("POST /api/v1/sessions", () => {
  beforeEach(async () => {
    await orchestrator.clearUserTable();
  });

  describe("Anonymous user", () => {
    test("With incorrect `email` but correct `password`", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });

      const response = await fetch(`${webServer.origin}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.errado@email.com",
          password: "senha-correta",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
        status_code: 401,
      });
    });

    test("With correct `email` but incorrect `password`", async () => {
      await orchestrator.createUser({
        email: "email.correto@email.com",
      });

      const response = await fetch(`${webServer.origin}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.correto@email.com",
          password: "senha-errada",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
        status_code: 401,
      });
    });

    test("With incorrect `email` and incorrect `password`", async () => {
      await orchestrator.createUser();

      const response = await fetch(`${webServer.origin}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.incorreto@email.com",
          password: "senha-errada",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
        status_code: 401,
      });
    });

    test("With correct `email` and `password`, but without permission to create session", async () => {
      await orchestrator.createUser({
        email: "correctUser@email.com",
        password: "correct-password",
      });

      const response = await fetch(`${webServer.origin}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "correctUser@email.com",
          password: "correct-password",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para fazer login.",
        action: "Contate o suporte caso você acredite que isso seja um erro",
        status_code: 403,
      });
    });

    test("With correct `email` and `password`", async () => {
      const user = await orchestrator.createUser({
        email: "correctUser@email.com",
        password: "correct-password",
      });

      await orchestrator.activateUser(user);

      const response = await fetch(`${webServer.origin}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "correctUser@email.com",
          password: "correct-password",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        created_at: responseBody.created_at,
        user_id: user.id,
        updated_at: responseBody.updated_at,
        expires_at: responseBody.expires_at,
        token: responseBody.token,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();

      // `expires_at` é calculado na aplicação antes da persistência.
      // `created_at` é calculado depois na camada do banco de dados.
      // Por isso, o tempo real entre as duas datas pode ficar ligeiramente
      // menor do que o tempo de expiração configurado e não bater 30 dias nos
      // milissegundos caso seja calculado apenas `expires_at` - `created_at`.
      // Então a ideia é garantir que no momento `expires_at` seja maior que
      // `created_at`, e também que possa existir distância de até 5 segundos
      // entre as duas datas para cobrir o caso do banco sofrer algum load
      // inesperado nos testes.

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expect(expiresAt >= createdAt).toBe(true);

      const actualLifetimeInMiliseconds = expiresAt - createdAt;
      const lifetimeDifferenceInMiliseconds =
        session.EXPIRATION_IN_MILISSECONDS - actualLifetimeInMiliseconds;

      expect(lifetimeDifferenceInMiliseconds).toBeLessThanOrEqual(5000);

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: responseBody.token,
        maxAge: session.EXPIRATION_IN_MILISSECONDS / 1000,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
    });
  });
});
