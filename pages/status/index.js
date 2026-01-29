import useSWR from "swr";

async function fetchStatus() {
  const response = await fetch("api/v1/status");
  const responseData = await response.json();
  return responseData;
}

function LastUpdated({ dateUpdated }) {
  return (
    <p>
      <b>Última atualização: </b>{" "}
      {new Date(dateUpdated).toLocaleString("pt-BR")}
    </p>
  );
}

function DatabaseStatus({ databaseData }) {
  const { max_connections, opened_connections, version } = databaseData;

  return (
    <>
      <h2>Banco de dados</h2>
      <p>
        <span>
          <b>Versão: </b> {version}
        </span>
        <br />
        <span>
          <b>Conexões abertas: </b> {opened_connections}
        </span>
        <br />
        <span>
          <b>Máximo de conexões: </b> {max_connections}
        </span>
      </p>
    </>
  );
}

export default function StatusPage() {
  const { data, isLoading } = useSWR("status", fetchStatus, {
    refreshInterval: 2000,
  });

  return (
    <main>
      <h1>Status</h1>

      {!isLoading && data && (
        <>
          <DatabaseStatus databaseData={data.dependencies.database} />
          <LastUpdated dateUpdated={data.updated_at} />
        </>
      )}
    </main>
  );
}
