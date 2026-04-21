import crypto from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MILISSECONDS = 60 * 60 * 24 * 30 * 1000; // 30 Days

async function runInsertQuery(token, userId, expiresAt) {
  const results = await database.query({
    text: `
      INSERT INTO
        sessions (token, user_id, expires_at)
      VALUES 
        ($1, $2, $3)
      RETURNING
        *
    ;`,
    values: [token, userId, expiresAt],
  });

  return results.rows[0];
}

async function findSectionByToken(sessionToken) {
  const results = await database.query({
    text: `
      select
        *
      FROM
        sessions
      WHERE
        token = $1
        AND expires_at > NOW()
      LIMIT 
        1
    ;`,
    values: [sessionToken],
  });

  return results.rows[0];
}

async function renewSession(sessionId, expiresAt) {
  const results = await database.query({
    text: `
      UPDATE
        sessions
      SET
        expires_at = $2,
        updated_at = NOW()
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [sessionId, expiresAt],
  });

  return results.rows[0];
}

async function createToken() {
  return crypto.randomBytes(48).toString("hex");
}

async function calculateExpirationDate() {
  return new Date(Date.now() + EXPIRATION_IN_MILISSECONDS);
}

async function create(userId) {
  const token = await createToken();
  const expiresAt = await calculateExpirationDate();
  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;
}

async function findOneValidByToken(sessionToken) {
  const sessionFound = await findSectionByToken(sessionToken);

  if (!sessionFound) {
    throw new UnauthorizedError({
      message: "Usuário não possui sessão ativa",
      action: "Verifique se este usuário está logado e tente novamente",
    });
  }

  return sessionFound;
}

async function renew(sessionId) {
  const expiresAt = await calculateExpirationDate();
  return await renewSession(sessionId, expiresAt);
}

const session = {
  create,
  EXPIRATION_IN_MILISSECONDS,
  findOneValidByToken,
  renew,
};

export default session;
