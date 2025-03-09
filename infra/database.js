import { Client } from "pg";

export async function query(queryObject) {
  const connection = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.NODE_ENV === "development" ? false : true,
  });

  let result;

  try {
    await connection.connect();

    result = await connection.query(queryObject);
  } catch (error) {
    console.error("Erro no banco de dados", error);
  } finally {
    await connection.end();
  }

  return result;
}
