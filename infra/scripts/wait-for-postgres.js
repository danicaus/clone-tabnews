const { exec } = require("node:child_process");

function checkPostgres() {
  const container_name =
    process.env.NODE_ENV === "test" ? "postgres-test" : "postgres-dev";
  exec(
    `docker exec ${container_name} pg_isready --host localhost`,
    handleReturn,
  );

  function handleReturn(error, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write(".");
      checkPostgres();
      return;
    }

    console.log("\n\n🟢 Postgres está pronto e aceitando conexões!\n");
  }
}

process.stdout.write("\n🔴 Aguardando que o Postgres esteja pronto");

checkPostgres();
