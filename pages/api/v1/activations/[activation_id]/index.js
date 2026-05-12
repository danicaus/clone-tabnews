import controller from "infra/controller";
import activation from "models/activation";
import authorization from "models/authorization";
import { createRouter } from "next-connect";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.activation_id;
  const userTryingToPatch = request.context.user;
  const usedToken = await activation.activateToken(activationTokenId);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedToken,
  );

  return response.status(200).json(secureOutputValues);
}
