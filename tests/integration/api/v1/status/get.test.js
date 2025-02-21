describe("GET to /api/v1/status", () => {
  let response;
  let responseBody;

  beforeEach(async () => {
    response = await fetch("http://localhost:3000/api/v1/status");
    responseBody = await response.json();
  });

  test("SHOULD return 200", () => {
    expect(response.status).toBe(200);
  });

  test("SHOULD return correct updated_at", async () => {
    const receivedUpdatedAt = responseBody.updated_at;
    const parsedUpdateAt = new Date(receivedUpdatedAt).toISOString();
    expect(receivedUpdatedAt).toBe(parsedUpdateAt);
  });

  test("SHOULD return postgres version", async () => {
    const { database } = responseBody.dependencies;
    expect(database.version).toBe("16.0");
  });

  test("SHOULD return max connections", () => {
    const { database } = responseBody.dependencies;
    expect(database.max_connections).toBe(100);
  });

  test("SHOULD return used connections", () => {
    const { database } = responseBody.dependencies;
    expect(database.opened_connections).toBe(1);
  });
});
