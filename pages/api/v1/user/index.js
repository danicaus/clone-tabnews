import { createRouter } from "next-connect";

import controller from "infra/controller";
import session from "models/session.js";
import authorization from "models/authorization";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { user: userAuthenticated, session: sessionObject } = request.context;

  const renewedSession = await session.renew(sessionObject.id);
  controller.setSessionCookie(renewedSession.token, response);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  const secureOutputValues = authorization.filterOutput(
    userAuthenticated,
    "read:user:self",
    userAuthenticated,
  );

  return response.status(200).json(secureOutputValues);
}
