import { NotFoundError, UnauthorizedError } from "infra/errors";
import user from "models/user.js";
import password from "models/password.js";

async function findUserByEmail(email) {
  try {
    return await user.findOneByEmail(email);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new UnauthorizedError({
        message: "Email não confere.",
        action: "Verifique se esse dado está correto",
      });
    }

    throw error;
  }
}

async function validatePassword(providedPassword, storedPassword) {
  const correctPasswordMatch = await password.compare(
    providedPassword,
    storedPassword,
  );

  if (!correctPasswordMatch) {
    throw new UnauthorizedError({
      message: "Senha não confere.",
      action: "Verifique se esse dado está correto",
    });
  }
}

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
      });
    }

    throw error;
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
