import database from "infra/database";
import email from "infra/email";
import webServer from "infra/webserver";

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

async function selectTokenByUserId(userId) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        user_id = $1
      LIMIT
        1
    ;`,
    values: [userId],
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

${webServer.origin}/cadastro/ativar/${activationToken.id}
        
Atenciosamente,
Equipe NerdTab`,
  });
}

async function create(userId) {
  const expiresAt = calculateExpirationDate();
  const newToken = await insertNewToken(userId, expiresAt);
  return newToken;
}

async function findOneByUserId(userId) {
  const token = await selectTokenByUserId(userId);
  return token;
}

const activation = {
  sendEmailToUser,
  create,
  findOneByUserId,
};

export default activation;
