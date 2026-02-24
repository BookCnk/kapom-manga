import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import {
  PrismaClient as PrismaClientConstructor,
  type PrismaClient as PrismaClientType,
} from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientType;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL in environment");
}

const sslCaPath = process.env.PG_SSL_CA_PATH;
const allowSelfSigned = process.env.PG_SSL_ALLOW_SELF_SIGNED === "true";

const ssl = sslCaPath
  ? { ca: readFileSync(sslCaPath, "utf8"), rejectUnauthorized: true }
  : allowSelfSigned
    ? { rejectUnauthorized: false }
    : undefined;

const adapter = new PrismaPg(new Pool({ connectionString, ssl }));

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClientConstructor({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
