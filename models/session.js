import crypto from "node:crypto";
import database from "infra/database";

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

const session = {
  create,
  EXPIRATION_IN_MILISSECONDS,
};

export default session;
