import database from "infra/database";
import { ValidationError } from "infra/errors";

async function saveNewUser({ username, email, password }) {
  const results = await database.query({
    text: `
    INSERT INTO 
      users (username,email,password) 
    VALUES 
      ($1, $2, $3)
    RETURNING 
      *
    ;`,
    values: [username, email, password],
  });

  return results.rows[0];
}

async function getUserByEmail(email) {
  return await database.query({
    text: `
      SELECT 
        email 
      FROM
        users 
      WHERE 
        LOWER(email) = LOWER($1)
      ;`,
    values: [email],
  });
}

async function getUserByUsername(username) {
  return await database.query({
    text: `
      SELECT 
        username 
      FROM
        users 
      WHERE 
        LOWER(username) = LOWER($1)
      ;`,
    values: [username],
  });
}

async function validateUniqueEmail(email) {
  const usersWithEmail = await getUserByEmail(email);

  if (usersWithEmail.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado",
      action: "Utilize outro email para realizar o cadastro",
    });
  }
}

async function validateUniqueUsername(username) {
  const usersWithUsername = await getUserByUsername(username);

  if (usersWithUsername.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado",
      action: "Utilize outro username para realizar o cadastro",
    });
  }
}

async function create(userInputValues) {
  const { email, username } = userInputValues;

  await validateUniqueEmail(email);
  await validateUniqueUsername(username);

  const newUser = await saveNewUser(userInputValues);
  return newUser;
}

const user = {
  create,
};

export default user;
