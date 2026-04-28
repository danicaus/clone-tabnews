import email from "infra/email.js";
import orchestrator from "../orchestrator";

describe("infra/email.js", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
  });
  beforeEach(async () => {
    await orchestrator.deleteAllEmails();
  });

  test("send", async () => {
    await email.send({
      from: "TabNerd <contato@tabnerd.com.br>",
      to: "contato@email.com",
      subject: "Teste de assunto",
      text: "Um texto de corpo",
    });

    await email.send({
      from: "TabNerd <contato@tabnerd.com.br>",
      to: "contato@email.com",
      subject: "Último email enviado",
      text: "Corpo do último email",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@tabnerd.com.br>");
    expect(lastEmail.recipients[0]).toBe("<contato@email.com>");
    expect(lastEmail.subject).toBe("Último email enviado");
    expect(lastEmail.text).toBe("Corpo do último email");
  });
});
