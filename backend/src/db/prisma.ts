import { PrismaClient } from "@prisma/client";

// A single PrismaClient per process. The client manages its own connection
// pool; constructing more than one exhausts Postgres connections under load.
let client: PrismaClient | undefined;

export function getPrismaClient(databaseUrl: string): PrismaClient {
  client ??= new PrismaClient({
    datasources: { db: { url: databaseUrl } }
  });
  return client;
}

export async function disconnectPrisma(): Promise<void> {
  if (client !== undefined) {
    await client.$disconnect();
    client = undefined;
  }
}
