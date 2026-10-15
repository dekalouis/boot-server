import { MigrationConfig } from "drizzle-orm/migrator";

type Config = {
  api: APIConfig;
  db: DBConfig;
  jwt: JWTConfig;
};

export type APIConfig = {
  fileServerHits: number;
  dbURL: string;
  port: number;
  platform: string;
  jwtSecret: string;
};

export type DBConfig = {
  dbURL: string;
  migrationConfig: MigrationConfig;
};

type JWTConfig = {
  defaultDuration: number;
  secret: string;
  issuer: string;
};

process.loadEnvFile('./.env');

function envOrThrow(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
}

export const config: Config = {
  api: {
    fileServerHits: 0,
    port: Number(process.env.PORT) || 8080,
    platform: envOrThrow("PLATFORM"),
  } as APIConfig,

  db: {
    dbURL: envOrThrow("DB_URL"),
    migrationConfig: migrationConfig,
  },
  jwt: {
    defaultDuration: 60 * 60,
    secret: envOrThrow("JWT_SECRET"),
    issuer: "chirpy",
  },
};
