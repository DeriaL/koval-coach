import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// The Neon WebSocket driver-adapter was removed: on Vercel it intermittently
// threw an unhandled socket error ("to.emit"), surfacing as a
// PrismaClientUnknownRequestError on every query. Plain Prisma over TCP to the
// pooled (PgBouncer) endpoint is the simplest, most reliable path for the Node
// runtime — both locally and on Vercel.
function connectionString() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    // Transaction-mode pooling (PgBouncer) can't use prepared statements, so
    // Prisma needs pgbouncer=true to disable them. Limit each serverless
    // instance to one connection so we don't exhaust the pool.
    if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
    if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
    return url.toString();
  } catch {
    return raw;
  }
}

function makeClient() {
  return new PrismaClient({ datasourceUrl: connectionString() });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
