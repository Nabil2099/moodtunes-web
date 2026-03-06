import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL has a default for SQLite
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const prisma = new PrismaClient();

export default prisma;
