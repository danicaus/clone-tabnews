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
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
});

module.exports = jestConfig;
