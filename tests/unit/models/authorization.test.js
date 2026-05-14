import { InternalServerError } from "infra/errors";
import authorization from "models/authorization.js";

function getError(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error("Expected function to throw");
}

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("without `user`", () => {
      const error = getError(() => authorization.can());

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.cause).toBe(
        "É necessário fornecer `user` no model `authorization`.",
      );
      expect(() => authorization.can()).toThrow(InternalServerError);
    });
    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };
      const error = getError(() => authorization.can(createdUser));

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.cause).toBe(
        "É necessário fornecer `user` no model `authorization`.",
      );
    });

    test("with unknown `features`", () => {
      const createdUser = {
        features: [],
      };
      const error = getError(() => authorization.can(createdUser));

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.cause).toBe(
        "É necessário fornecer uma `feature` conhecida no model `authorization`.",
      );
    });

    test("with valid `user` and known `feature`", () => {
      const createdUser = {
        features: ["create:user"],
      };
      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("without `user`", () => {
      const error = getError(() => authorization.filterOutput());

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.cause).toBe(
        "É necessário fornecer `user` no model `authorization`.",
      );
    });
    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };
      const error = getError(() => authorization.filterOutput(createdUser));

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.cause).toBe(
        "É necessário fornecer `user` no model `authorization`.",
      );
    });

    test("with unknown `features`", () => {
      const createdUser = {
        features: [],
      };
      const error = getError(() => authorization.filterOutput(createdUser));

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.cause).toBe(
        "É necessário fornecer uma `feature` conhecida no model `authorization`.",
      );
    });

    test("with valid `user`, known `feature`, but no `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };
      const error = getError(() =>
        authorization.filterOutput(createdUser, "read:user"),
      );

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.cause).toBe(
        "É necessário fornecer um `resource` no model `authorization`.",
      );
    });

    describe("with valid `user`, `feature`", () => {
      test("and `resource` = `read:user`", () => {
        const createdUser = {
          features: ["read:user"],
        };

        const resource = {
          id: 1,
          username: "resource",
          features: ["read:user"],
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          email: "resource@resource.com",
          password: "password123",
        };

        const result = authorization.filterOutput(
          createdUser,
          "read:user",
          resource,
        );

        expect(result).toEqual({
          id: 1,
          username: "resource",
          features: ["read:user"],
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        });
      });

      test("and `resource` = `read:user:self`", () => {
        const createdUser = {
          id: 1,
          features: ["read:user"],
        };

        const resource = {
          id: 1,
          username: "resource",
          features: ["read:user"],
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          email: "resource@resource.com",
          password: "password123",
        };

        const result = authorization.filterOutput(
          createdUser,
          "read:user:self",
          resource,
        );

        expect(result).toEqual({
          id: 1,
          username: "resource",
          features: ["read:user"],
          email: "resource@resource.com",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        });
      });
      test("and `resource` = `read:session`", () => {
        const createdUser = {
          id: 1,
          features: ["read:session"],
        };

        const resource = {
          id: "id",
          token: "token",
          user_id: 1,
          created_at: "created_at",
          updated_at: "updated_at",
          expires_at: "expires_at",
        };

        const result = authorization.filterOutput(
          createdUser,
          "read:session",
          resource,
        );

        expect(result).toEqual({
          id: "id",
          token: "token",
          user_id: 1,
          created_at: "created_at",
          updated_at: "updated_at",
          expires_at: "expires_at",
        });
      });

      test("and `resource` = `read:activation_token`", () => {
        const createdUser = {
          id: 1,
          features: ["read:activation_token"],
        };

        const resource = {
          id: "id",
          used_at: "used_at",
          user_id: "user_id",
          created_at: "created_at",
          updated_at: "updated_at",
          expires_at: "expires_at",
        };

        const result = authorization.filterOutput(
          createdUser,
          "read:activation_token",
          resource,
        );

        expect(result).toEqual({
          id: "id",
          used_at: "used_at",
          user_id: "user_id",
          created_at: "created_at",
          updated_at: "updated_at",
          expires_at: "expires_at",
        });
      });
      test("and `resource` = `read:migration`", () => {
        const createdUser = {
          id: 1,
          features: ["read:migration"],
        };

        const resource = [
          {
            path: "path1",
            name: "name1",
            timestamp: "timestamp1",
          },
          {
            path: "path2",
            name: "name2",
            timestamp: "timestamp2",
          },
        ];

        const result = authorization.filterOutput(
          createdUser,
          "read:migration",
          resource,
        );

        expect(result).toEqual([
          {
            path: "path1",
            name: "name1",
            timestamp: "timestamp1",
          },
          {
            path: "path2",
            name: "name2",
            timestamp: "timestamp2",
          },
        ]);
      });

      describe("and `resource` = `read:statusPage`", () => {
        test("and user does not have feature `read:statusPage:all`", () => {
          const createdUser = {
            id: 1,
            features: ["read:statusPage"],
          };

          const resource = {
            updated_at: "updated_at",
            dependencies: {
              database: {
                version: "16.0",
                max_connections: "max_connections",
                opened_connections: "opened_connections",
              },
            },
          };

          const result = authorization.filterOutput(
            createdUser,
            "read:statusPage",
            resource,
          );

          expect(result).toEqual({
            updated_at: "updated_at",
            dependencies: {
              database: {
                max_connections: "max_connections",
                opened_connections: "opened_connections",
              },
            },
          });
        });
        test("and user have feature `read:statusPage:all`", () => {
          const createdUser = {
            id: 1,
            features: ["read:statusPage:all"],
          };

          const resource = {
            updated_at: "updated_at",
            dependencies: {
              database: {
                version: "16.0",
                max_connections: "max_connections",
                opened_connections: "opened_connections",
              },
            },
          };

          const result = authorization.filterOutput(
            createdUser,
            "read:statusPage",
            resource,
          );

          expect(result).toEqual({
            updated_at: "updated_at",
            dependencies: {
              database: {
                version: "16.0",
                max_connections: "max_connections",
                opened_connections: "opened_connections",
              },
            },
          });
        });
      });
    });
  });
});
