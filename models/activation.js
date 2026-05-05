import database from "infra/database";
import email from "infra/email";
import { NotFoundError } from "infra/errors";
import webServer from "infra/webserver";
import user from "./user";

const TOKEN_EXPIRATION_IN_MILISSECONDS = 60 * 15 * 1000; // 15 minutos

async function insertNewToken(userId, expiresAt) {
  const results = await database.query({
    text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
    ;`,
    values: [userId, expiresAt],
  });

  return results.rows[0];
}

async function findOneValidById(userId) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1  
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT
        1
    ;`,
    values: [userId],
  });

  return results.rows[0];
}

async function updateTokenToUsed(token) {
  const results = await database.query({
    text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
    `,
    values: [token],
  });

  return results.rows[0];
}

function calculateExpirationDate() {
  return new Date(Date.now() + TOKEN_EXPIRATION_IN_MILISSECONDS);
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "NerdTab <contato@nerdtab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no NerdTab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no NerdTab:

${webServer.origin}/registration/activate/${activationToken.id}
        
Atenciosamente,
Equipe NerdTab`,
  });
}

async function create(userId) {
  const expiresAt = calculateExpirationDate();
  const newToken = await insertNewToken(userId, expiresAt);
  return newToken;
}

async function findValidToken(token) {
  const validToken = await findOneValidById(token);

  if (!validToken) {
    throw new NotFoundError({
      message:
        "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
      action: "Faça um novo cadastro.",
    });
  }

  return validToken;
}

async function activateUserByUserId(userId) {
  return await user.setFeatures(userId, ["create:session", "read:session"]);
}

async function activateToken(token) {
  const validActivationToken = await findValidToken(token);
  const validatedToken = await updateTokenToUsed(validActivationToken.id);
  await activateUserByUserId(validatedToken.user_id);

  return validatedToken;
}

const activation = {
  sendEmailToUser,
  create,
  findValidToken,
  activateToken,
  activateUserByUserId,
};

export default activation;
