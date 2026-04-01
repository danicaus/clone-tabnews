import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";

const router = createRouter();
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValue = JSON.parse(request.body);
  const newUser = await user.create(userInputValue);
  return response.status(201).json(newUser);
}
