import user from "models/user.js";
import orchestrator from "tests/integration/orchestrator.js";
import password from "models/password.js";

describe("PATCH /api/v1/user/[username]", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
  });

  describe("Anonymous user", () => {
    beforeEach(async () => {
      await orchestrator.clearUserTable();
    });

    test("With nonexistent username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexistent",
        {
          method: "PATCH",
          body: {
            email: "nonexistent@email.com",
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
      test("from another user", async () => {
        await user.create({
          username: "user",
          email: "user@email.com",
          password: "senha123",
        });
        await user.create({
          username: "usedUsername",
          email: "user2@email.com",
          password: "senha123",
        });

        const response = await fetch(
          "http://localhost:3000/api/v1/users/user",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: "usedUsername",
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

      test("from same user", async () => {
        await user.create({
          username: "user",
          email: "user1@email.com",
          password: "senha123",
        });

        const response = await fetch(
          "http://localhost:3000/api/v1/users/user",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
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
      await user.create({
        username: "user",
        email: "user@email.com",
        password: "senha123",
      });
      await user.create({
        username: "usedEmail",
        email: "usedEmail@email.com",
        password: "senha123",
      });

      const response = await fetch("http://localhost:3000/api/v1/users/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "usedEmail@email.com",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado",
        action: "Utilize outro email para realizar esta operação",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      await user.create({
        username: "uniqueUser",
        email: "uniqueUser@email.com",
        password: "senha123",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUser",
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

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "unique_Username",
        email: "uniqueUser@email.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      await user.create({
        username: "uniqueEmail",
        email: "uniqueEmail@email.com",
        password: "senha123",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueEmail",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
        username: "uniqueEmail",
        email: "unique_email@email.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      await user.create({
        username: "newPassword",
        email: "newPassword@email.com",
        password: "oldPassword",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/newPassword",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
        username: "newPassword",
        email: "newPassword@email.com",
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
});
