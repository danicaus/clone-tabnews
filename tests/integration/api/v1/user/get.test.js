import setCookieParser from "set-cookie-parser";

import orchestrator from "tests/integration/orchestrator.js";
import session from "models/session.js";

const ONE_DAY_IN_MILISSECONDS = 60 * 60 * 24 * 1000;

describe("GET /api/v1/user", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
  });

  beforeEach(async () => {
    await orchestrator.clearUserTable();
    await orchestrator.clearSessionTable();
  });

  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      const responseBody = await response.json();

      // Dados de resposta
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      // Renovação de sessão - dados salvos no banco
      const renewedSession = await session.findOneValidByToken(
        sessionObject.token,
      );
      const expiresAt = new Date(renewedSession.expires_at);
      expiresAt.setMilliseconds(0);
      expect(renewedSession.expires_at > sessionObject.expires_at).toBe(true);
      expect(renewedSession.updated_at > sessionObject.updated_at).toBe(true);

      // Renovação de sessão - dados de cookies
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });
      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MILISSECONDS / 1000,
        path: "/",
        httpOnly: true,
      });

      //Renovação de sessão - dados de cache
      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );
    });

    test("With 30 days old valid session", async () => {
      const almostThirtyDaysAgo = new Date(
        Date.now() - ONE_DAY_IN_MILISSECONDS * 30 + 1000,
      );

      jest.useFakeTimers({
        now: almostThirtyDaysAgo,
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithValid30DaysOldSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValid30DaysOldSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      const renewedSession = await session.findOneValidByToken(
        sessionObject.token,
      );

      const expiresAt = new Date(renewedSession.expires_at);
      expiresAt.setMilliseconds(0);

      expect(renewedSession.expires_at > sessionObject.expires_at).toBe(true);
      expect(renewedSession.updated_at > sessionObject.updated_at).toBe(true);

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MILISSECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With 15 days old valid session", async () => {
      const fifteenDaysAgo = new Date(
        Date.now() - ONE_DAY_IN_MILISSECONDS * 15,
      );

      jest.useFakeTimers({
        now: fifteenDaysAgo,
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithValid15DaysOldSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValid15DaysOldSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      const renewedSession = await session.findOneValidByToken(
        sessionObject.token,
      );

      const expiresAt = new Date(renewedSession.expires_at);
      expiresAt.setMilliseconds(0);

      expect(renewedSession.expires_at > sessionObject.expires_at).toBe(true);
      expect(renewedSession.updated_at > sessionObject.updated_at).toBe(true);

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MILISSECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "a3d98b66338d353d216dfbf8c77639e2add1e95453cda2fa96ec42f92b9bd32f0923c49e5d2349447498646f79dd5e85";

      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa",
        action: "Verifique se este usuário está logado e tente novamente",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILISSECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa",
        action: "Verifique se este usuário está logado e tente novamente",
        status_code: 401,
      });
    });
  });
});
