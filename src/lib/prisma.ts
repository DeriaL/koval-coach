import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Use WebSocket on Node.js (Neon serverless driver works in serverless funcs)
if (typeof WebSocket === "undefined") {
  // @ts-ignore
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const connectionString = process.env.DATABASE_URL!;
  // On serverless / Vercel: use Neon HTTP-pooled adapter for fast cold starts
  if (process.env.VERCEL || process.env.NEON_HTTP) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter });
  }
  // Locally: vanilla Prisma over TCP (better DX)
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? makeClient();

// Only cache in dev. In production the Neon WebSocket pool must NOT be reused
// across serverless invocations — a cached pool's WS connection drops on idle
// and reusing it throws a server-side exception. Each cold start makes a fresh
// client (module scope is per-instance anyway).
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
