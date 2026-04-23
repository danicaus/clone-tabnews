import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "./password";

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
        * 
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
        * 
      FROM
        users 
      WHERE 
        LOWER(username) = LOWER($1)
      LIMIT 
        1
      ;`,
    values: [username],
  });
}

async function getUserById(id) {
  return await database.query({
    text: `
      SELECT 
        * 
      FROM
        users 
      WHERE 
        id = $1
      LIMIT
        1
      ;`,
    values: [id],
  });
}

async function updateUser(userWithNewValues) {
  return await database.query({
    text: `
      UPDATE
        users
      SET 
        username = $2,
        email = $3,
        password = $4,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [
      userWithNewValues.id,
      userWithNewValues.username,
      userWithNewValues.email,
      userWithNewValues.password,
    ],
  });
}

async function validateUniqueEmail(email) {
  const usersWithEmail = await getUserByEmail(email);

  if (usersWithEmail.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado",
      action: "Utilize outro email para realizar esta operação",
    });
  }
}

async function validateUniqueUsername(username) {
  const usersWithUsername = await getUserByUsername(username);

  if (usersWithUsername.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado",
      action: "Utilize outro username para realizar esta operação",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

async function create(userInputValues) {
  const { email, username } = userInputValues;

  await validateUniqueUsername(username);
  await validateUniqueEmail(email);
  await hashPasswordInObject(userInputValues);

  const newUser = await saveNewUser(userInputValues);
  return newUser;
}

async function findOneByUsername(username) {
  const userData = await getUserByUsername(username);

  const userFound = userData?.rows?.[0];

  if (!userFound) {
    throw new NotFoundError({
      message: "O username informado não foi encontrado no sistema",
      action: "Verifique se o username está digitado corretamente",
    });
  }

  return userFound;
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInputValues) {
    const inputUsernameData = await getUserByUsername(userInputValues.username);
    const isEquivalentUsername =
      inputUsernameData?.rows?.[0]?.id === currentUser.id;

    if (!isEquivalentUsername) {
      await validateUniqueUsername(userInputValues.username);
    }
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = {
    ...currentUser,
    ...userInputValues,
  };

  const updatedUser = await updateUser(userWithNewValues);

  return updatedUser.rows[0];
}

async function findOneByEmail(email) {
  const userData = await getUserByEmail(email);

  const userFound = userData?.rows?.[0];

  if (!userFound) {
    throw new NotFoundError({
      message: "O email informado não foi encontrado no sistema",
      action: "Verifique se o email está digitado corretamente",
    });
  }

  return userFound;
}

async function findOneById(userId) {
  const userData = await getUserById(userId);

  const userFound = userData?.rows?.[0];

  if (!userFound) {
    throw new NotFoundError({
      message: "O id informado não foi encontrado no sistema",
      action: "Verifique se o id está digitado corretamente",
    });
  }

  return userFound;
}

const user = {
  create,
  findOneByUsername,
  update,
  findOneByEmail,
  findOneById,
};

export default user;
