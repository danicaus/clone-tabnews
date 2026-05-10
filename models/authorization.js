function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = user.id === resource.id || can(user, "update:user:others");
  }

  return authorized;
}

const authorization = {
  can,
};

export default authorization;
