const dotenv = require("dotenv");
const nextJest = require("next/jest");

dotenv.config({
  path: ".env.test",
});

const createJestConfig = nextJest({
  dir: ".",
});
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60000,
});

module.exports = jestConfig;
