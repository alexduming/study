import { getAllConfigs } from "@/shared/services/config";
import { envConfigs } from "@/config";
import { getUuid } from "@/shared/lib/hash";
import { db } from "@/core/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/config/db/schema";

// static auth options
export const authOptions = {
  appName: envConfigs.app_name,
  baseURL: envConfigs.auth_url,
  secret: envConfigs.auth_secret,
  trustedOrigins: envConfigs.app_url ? [envConfigs.app_url] : [],
};

// get dynamic auth options
export async function getAuthOptions() {
  const configs = await getAllConfigs();
  return {
    ...authOptions,
    database: envConfigs.database_url
      ? drizzleAdapter(db(), {
          provider: getDatabaseProvider(envConfigs.database_provider),
          schema: schema,
        })
      : null,
    advanced: {
      database: {
        generateId: () => getUuid(),
      },
    },
    emailAndPassword: {
      enabled: configs.email_auth_enabled !== "false",
    },
    socialProviders: await getSocialProviders(configs),
  };
}

export async function getSocialProviders(configs: Record<string, string>) {
  // get configs from db
  const providers: any = {};

  if (configs.google_client_id && configs.google_client_secret) {
    providers.google = {
      clientId: configs.google_client_id,
      clientSecret: configs.google_client_secret,
    };
  }

  if (configs.github_client_id && configs.github_client_secret) {
    providers.github = {
      clientId: configs.github_client_id,
      clientSecret: configs.github_client_secret,
    };
  }

  return providers;
}

export function getDatabaseProvider(
  provider: string
): "sqlite" | "pg" | "mysql" {
  switch (provider) {
    case "sqlite":
      return "sqlite";
    case "postgresql":
      return "pg";
    case "mysql":
      return "mysql";
    default:
      throw new Error(
        `Unsupported database provider for auth: ${envConfigs.database_provider}`
      );
  }
}
