import activation from "models/activation";
import orchestrator from "../orchestrator";

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody, createUserResponse;

  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
    await orchestrator.deleteAllEmails();

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
  });

  test("Create user account", async () => {
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
    const activationToken = await activation.findOneByUserId(
      createUserResponseBody.id,
    );

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@nerdtab.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@nerdtab.com.br>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no NerdTab!");
    expect(lastEmail.text).toContain("RegistrationFlow");
    expect(lastEmail.text).toContain(activationToken.id);
  });

  test("Activate account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
