import orchestrator from "tests/integration/orchestrator.js";
import password from "models/password.js";

describe("PATCH /api/v1/user/[username]", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
  });

  describe("Anonymous user", () => {
    test("With unique 'username'", async () => {
      const user = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "unique_Username",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: "Você não possui permissão para executar esta ação",
        action: 'Verifique se o seu usuário possui a feature "update:user"',
        status_code: 403,
        name: "ForbiddenError",
      });
    });
  });

  describe("Default user", () => {
    beforeEach(async () => {
      await orchestrator.clearUserTable();
    });

    test("With nonexistent username", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/nonexistent`,
        {
          method: "PATCH",
          body: {
            email: "nonexistent@email.com",
          },
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
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

    describe("With duplicated `username`", () => {
      test("to another user's username", async () => {
        const createdUser1 = await orchestrator.createUser({
          username: "user1",
        });
        await orchestrator.createUser({
          username: "user2",
        });

        await orchestrator.activateUser(createdUser1);
        const sessionObject1 = await orchestrator.createSession(createdUser1);

        const response = await fetch(
          "http://localhost:3000/api/v1/users/user1",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${sessionObject1.token}`,
            },
            body: JSON.stringify({
              username: "user2",
            }),
          },
        );

        expect(response.status).toBe(400);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          name: "ValidationError",
          message: "O username informado já está sendo utilizado",
          action: "Utilize outro username para realizar esta operação",
          status_code: 400,
        });
      });

      test("to same username, with a different case", async () => {
        const createdUser = await orchestrator.createUser({
          username: "user",
        });
        await orchestrator.activateUser(createdUser);
        const sessionObject = await orchestrator.createSession(createdUser);

        const response = await fetch(
          "http://localhost:3000/api/v1/users/user",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              username: "USER",
            }),
          },
        );

        expect(response.status).toBe(200);
      });
    });

    test("With duplicated 'email'", async () => {
      const createdUser = await orchestrator.createUser({
        email: "user@email.com",
      });
      await orchestrator.createUser({
        email: "usedEmail@email.com",
      });
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "usedEmail@email.com",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado",
        action: "Utilize outro email para realizar esta operação",
        status_code: 400,
      });
    });

    test("With `user1` targeting `user2`", async () => {
      const createdUser1 = await orchestrator.createUser({
        username: "user1",
      });
      await orchestrator.createUser({
        username: "user2",
      });

      await orchestrator.activateUser(createdUser1);
      const sessionObject1 = await orchestrator.createSession(createdUser1);

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject1.token}`,
        },
        body: JSON.stringify({
          username: "user3",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para atualizar outro usuário.",
        action:
          "Verifique se você possui a fature necessária para atualizar outro usuário.",
        status_code: 403,
      });
    });

    test("With unique 'username'", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "unique_Username",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "unique_Username",
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "unique_email@email.com",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: "unique_email@email.com",
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser({
        password: "oldPassword",
      });
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser);
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            password: "newPassword",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const correctPasswordMatch = await password.compare(
        "newPassword",
        responseBody.password,
      );
      const incorrectPasswordMatch = await password.compare(
        "oldPassword",
        responseBody.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });

  describe("Provileged user", () => {
    test.only("With `update:users:others` targeting `defaultUser`", async () => {
      const privilegedUser = await orchestrator.createUser();
      const userObject = await orchestrator.activateUser(privilegedUser);
      const privilegedUserSession =
        await orchestrator.createSession(privilegedUser);
      const teste = await orchestrator.addFeaturesToUser(userObject, [
        "update:user:others",
      ]);

      const defaultUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
          body: JSON.stringify({
            username: "otherUsername",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({});
    });
  });
});
