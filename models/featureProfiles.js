const newUser = ["read:activation_token"];
const activatedUser = ["create:session", "read:session", "update:user"];
const anonymousUser = [
  "read:activation_token",
  "create:session",
  "create:user",
  "read:statusPage",
];

const privilegedResources = {
  updateOtherUser: "update:user:others",
  readAllStatuspageInfo: "read:statusPage:all",
  runMigrations: "update:migration",
};

const featureProfiles = {
  anonymousUser,
  newUser,
  activatedUser,
  privilegedResources,
};

export default featureProfiles;
