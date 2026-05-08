function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = user.id === resource.id;
  }

  return authorized;
}

const authorization = {
  can,
};

export default authorization;
