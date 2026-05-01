import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Singleton pattern — safe for Next.js edge + serverless
const globalForDb = globalThis as unknown as { _tursoClient?: ReturnType<typeof createClient> };

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// During build time on CI, these might be missing. 
// We provide a dummy URL to prevent the 'URL_INVALID' error during static analysis.
const client =
  globalForDb._tursoClient ??
  createClient({
    url: url || "libsql://dummy.turso.io",
    authToken: authToken || "dummy",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb._tursoClient = client;
}

export const db = drizzle(client, { schema });
export type DB = typeof db;
