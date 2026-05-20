const availableFeatures = [
  // USERS
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",

  //SESSION
  "create:session",
  "read:session",
  "read:activation_token",

  //MIGRATION
  "read:migration",
  "update:migration",

  //STATUS PAGE
  "read:statusPage",
  "read:statusPage:all",
];

const profiles = {
  newUser: ["read:activation_token"],
  activatedUser: ["create:session", "read:session", "update:user"],
  anonymousUser: ["read:activation_token", "create:session", "create:user"],
};

const privilegedResources = {
  updateOtherUser: "update:user:others",
  readAllStatuspageInfo: "read:statusPage:all",
  runMigrations: "update:migration",
};

const feature = {
  profiles,
  privilegedResources,
  availableFeatures,
};

export default feature;
