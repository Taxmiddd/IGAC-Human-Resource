import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Singleton pattern — safe for Next.js edge + serverless
const globalForDb = globalThis as unknown as { _tursoClient?: ReturnType<typeof createClient> };

const client =
  globalForDb._tursoClient ??
  createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb._tursoClient = client;
}

export const db = drizzle(client, { schema });
export type DB = typeof db;
