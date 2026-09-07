import "server-only";

import { DatabaseClient, getPool } from "./client";

export async function withTransaction<T>(
  operation: (client: DatabaseClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  let releaseError: Error | undefined;

  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      releaseError = rollbackError instanceof Error ? rollbackError : new Error("Transaction rollback failed");
      console.error("Transaction rollback failed", rollbackError);
    }
    throw error;
  } finally {
    client.release(releaseError);
  }
}
