import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "./schema";

const databaseDirectory =
  process.env.DATABASE_DIRECTORY ??
  path.join(process.cwd(), "data");
const databaseFile =
  process.env.DATABASE_FILE ??
  path.join(databaseDirectory, "promptr.db");

if (!fs.existsSync(databaseDirectory)) {
  fs.mkdirSync(databaseDirectory, { recursive: true });
}

type SqliteInstance = InstanceType<typeof Database>;

type GlobalDrizzleState = {
  sqlite?: SqliteInstance;
  drizzleDb?: ReturnType<typeof drizzle<typeof schema>>;
  migrated?: boolean;
};

const globalForDb = globalThis as typeof globalThis & {
  __promptrDrizzle?: GlobalDrizzleState;
};

const state: GlobalDrizzleState =
  globalForDb.__promptrDrizzle ??= {};

if (!state.sqlite) {
  state.sqlite = new Database(databaseFile);
  state.sqlite.pragma("foreign_keys = ON");
  state.sqlite.pragma("journal_mode = WAL");
}

if (!state.drizzleDb) {
  state.drizzleDb = drizzle(state.sqlite, { schema });
}

const shouldMigrate =
  process.env.NODE_ENV !== "production" &&
  process.env.DATABASE_MIGRATE_ON_BOOT === "true" &&
  !state.migrated;

if (shouldMigrate) {
  try {
    migrate(state.drizzleDb, {
      migrationsFolder: path.join(process.cwd(), "drizzle/migrations"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) {
      throw error;
    }
    console.warn("Skipping migrations because tables already exist.");
  } finally {
    state.migrated = true;
  }
}

export const db = state.drizzleDb;
