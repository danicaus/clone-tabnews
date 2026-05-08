import activation from "models/activation";
import orchestrator from "../orchestrator";
import webServer from "infra/webserver";
import user from "models/user";

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody,
    createUserResponse,
    activationTokenId,
    createSessionResponseBody;

  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
    await orchestrator.deleteAllEmails();
  });

  test("Create user account", async () => {
    createUserResponse = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "RegistrationFlow",
        email: "registration.flow@nerdtab.com.br",
        password: "RegistrationFlowPassword",
      }),
    });

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponse.status).toBe(201);

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@nerdtab.com.br",
      features: ["read:activation_token"],
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@nerdtab.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@nerdtab.com.br>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no NerdTab!");
    expect(lastEmail.text).toContain("RegistrationFlow");

    activationTokenId = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webServer.origin}/registration/activate/${activationTokenId}`,
    );

    const validActivationToken =
      await activation.findValidToken(activationTokenId);

    expect(validActivationToken.user_id).toBe(createUserResponseBody.id);
    expect(validActivationToken.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const activateAccountResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(activateAccountResponse.status).toBe(200);

    const activationResponseBody = await activateAccountResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername("RegistrationFlow");
    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login", async () => {
    const createSessionResponse = await fetch(
      `http://localhost:3000/api/v1/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@nerdtab.com.br",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createSessionResponse.status).toBe(201);

    createSessionResponseBody = await createSessionResponse.json();

    expect(createSessionResponseBody.user_id).toBe(createUserResponseBody.id);
  });

  test("Get user information", async () => {
    const readUserResponse = await fetch(`http://localhost:3000/api/v1/user`, {
      headers: {
        Cookie: `session_id=${createSessionResponseBody.token}`,
      },
    });

    expect(readUserResponse.status).toBe(200);

    const readuserResponseBody = await readUserResponse.json();

    expect(readuserResponseBody.id).toBe(createUserResponseBody.id);
  });
});
