import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// WebSocket constructor for the Neon driver on the Node.js runtime.
if (typeof WebSocket === "undefined") {
  // @ts-ignore
  neonConfig.webSocketConstructor = ws;
}

// Route pooled queries over HTTP fetch instead of a long-lived WebSocket.
// On Vercel the WS connection drops between invocations and the Pool emits an
// unhandled "to.emit" socket error, which crashed every request
// (PrismaClientUnknownRequestError). Fetch is stateless and serverless-safe.
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const connectionString = process.env.DATABASE_URL!;
  // On serverless / Vercel: Neon serverless driver (HTTP-fetch pooled).
  // Plain TCP (port 5432) is unreliable from Vercel functions to Neon.
  if (process.env.VERCEL || process.env.NEON_HTTP) {
    const pool = new Pool({ connectionString });
    // Never let a dropped socket bubble up as an unhandled error.
    pool.on("error", (e) => console.error("[neon-pool]", e?.message ?? e));
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter });
  }
  // Locally: vanilla Prisma over TCP (better DX).
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? makeClient();

// Only cache in dev. Each serverless cold start makes a fresh client.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
