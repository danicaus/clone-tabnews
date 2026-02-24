import useSWR from "swr";

async function fetchStatus() {
  const response = await fetch("api/v1/status");
  const responseData = await response.json();
  return responseData;
}

const Loading = () => <span>Carregando...</span>;

function LastUpdated({ dateUpdated }) {
  return <>{new Date(dateUpdated).toLocaleString("pt-BR")}</>;
}

function DatabaseStatus({ databaseData }) {
  const { max_connections, opened_connections, version } = databaseData;
  return (
    <div>
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
    </div>
  );
}

export default function StatusPage() {
  const { data, isLoading } = useSWR("status", fetchStatus, {
    refreshInterval: 2000,
  });

  return (
    <main>
      <h1>Status</h1>
      <div>
        <b>Última atualização: </b>{" "}
        {isLoading ? (
          <Loading />
        ) : (
          <LastUpdated dateUpdated={data?.updated_at} />
        )}
      </div>

      <h2>Database</h2>
      {isLoading ? (
        <Loading />
      ) : (
        <DatabaseStatus databaseData={data?.dependencies.database} />
      )}
    </main>
  );
}
