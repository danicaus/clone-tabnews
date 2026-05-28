// The below can be used in a Jest global setup file or similar for your testing set-up
import orchestrator from "tests/integration/orchestrator";

const currentTestFile = expect.getState().testPath;

const isMigrationTest = /migrations\/(get|post)\.test\.[jt]sx?$/.test(
  currentTestFile,
);

if (isMigrationTest) {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runFirstMigrations();
  });
} else {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
  });
}
