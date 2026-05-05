import controller from "infra/controller";
import activation from "models/activation";
import { createRouter } from "next-connect";

const router = createRouter();
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.activation_id;
  const usedToken = await activation.activateToken(activationTokenId);

  return response.status(200).json(usedToken);
}
