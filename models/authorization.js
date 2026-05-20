import { InternalServerError } from "infra/errors";
import { default as featureModel } from "./feature";

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = user.id === resource.id || can(user, "update:user:others");
  }

  return authorized;
}

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);
  const filterDataForReturn = {
    readUser: "read:user",
    readUserSelf: "read:user:self",
    readSession: "read:session",
    readActivationToken: "read:activation_token",
    readMigrations: "read:migration",
    readStatusPage: "read:statusPage",
  };

  const userResource =
    feature === filterDataForReturn.readUser ||
    feature === filterDataForReturn.readUserSelf;
  const sessionResource = feature === filterDataForReturn.readSession;
  const activationTokenResource =
    feature === filterDataForReturn.readActivationToken;
  const migrationsResource = feature === filterDataForReturn.readMigrations;
  const statusPageResource = feature === filterDataForReturn.readStatusPage;

  if (userResource) {
    return filterUserReturn(user, feature, resource);
  }

  if (sessionResource) {
    return filterSessionReturn(user, feature, resource);
  }

  if (activationTokenResource) {
    return filterTokenReturn(user, feature, resource);
  }

  if (migrationsResource) {
    return filterMigrationsReturn(user, feature, resource);
  }

  if (statusPageResource) {
    return filterStatuspageReturn(user, feature, resource);
  }
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "É necessário fornecer `user` no model `authorization`.",
    });
  }
}

function validateFeature(feature) {
  if (!feature || !featureModel.availableFeatures.includes(feature)) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer uma `feature` conhecida no model `authorization`.",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause: "É necessário fornecer um `resource` no model `authorization`.",
    });
  }
}

function filterUserReturn(user, feature, userTableData) {
  const secureReturn = {
    id: userTableData.id,
    username: userTableData.username,
    features: userTableData.features,
    created_at: userTableData.created_at,
    updated_at: userTableData.updated_at,
  };

  if (feature === "read:user:self" && user.id === userTableData.id) {
    const secureWithEmailReturn = structuredClone(secureReturn);
    secureWithEmailReturn.email = userTableData.email;

    return secureWithEmailReturn;
  }

  return secureReturn;
}

function filterSessionReturn(user, feature, sessionTableData) {
  if (user.id === sessionTableData.user_id) {
    return {
      id: sessionTableData.id,
      token: sessionTableData.token,
      user_id: sessionTableData.user_id,
      created_at: sessionTableData.created_at,
      updated_at: sessionTableData.updated_at,
      expires_at: sessionTableData.expires_at,
    };
  }
}

function filterTokenReturn(user, feature, userActivationTokenTableData) {
  return {
    id: userActivationTokenTableData.id,
    used_at: userActivationTokenTableData.used_at,
    user_id: userActivationTokenTableData.user_id,
    created_at: userActivationTokenTableData.created_at,
    updated_at: userActivationTokenTableData.updated_at,
    expires_at: userActivationTokenTableData.expires_at,
  };
}

function filterMigrationsReturn(user, feature, migrationTableData) {
  return migrationTableData.map((data) => ({
    path: data.path,
    name: data.name,
    timestamp: data.timestamp,
  }));
}

function filterStatuspageReturn(user, feature, statusData) {
  const secureReturn = {
    updated_at: statusData.updated_at,
    dependencies: {
      database: {
        max_connections: statusData.dependencies.database.max_connections,
        opened_connections: statusData.dependencies.database.opened_connections,
      },
    },
  };

  if (can(user, "read:statusPage:all")) {
    const completeReturn = structuredClone(secureReturn);
    completeReturn.dependencies.database.version =
      statusData.dependencies.database.version;

    return completeReturn;
  }

  return secureReturn;
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
