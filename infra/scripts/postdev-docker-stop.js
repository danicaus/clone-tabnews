const { spawn } = require("child_process");
const { execSync } = require("child_process");

const nextDev = spawn("next", ["dev"], {
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  console.log("\n🛑 Parando servidor de desenvolvimento...");
  try {
    execSync("npm run docker:stop:dev", { stdio: "inherit" });
  } catch (error) {
    console.error("Erro ao parar containers:", error.message);
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

nextDev.on("exit", (code) => {
  if (code !== 0) {
    cleanup();
  }
});
