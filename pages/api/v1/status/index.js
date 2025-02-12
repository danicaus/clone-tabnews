import { query } from "../../../../infra/database";

export default async function status(req, res) {
  const result = await query("SELECT 1 + 1 as resultado_soma;");
  console.log(result.rows);
  res.status(200).json({ chave: "valor" });
}
