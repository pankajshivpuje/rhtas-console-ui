/** Define process.env to contain `ConsoleEnvType` */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends Partial<Readonly<ConsoleEnvType>> {}
  }
}

/**
 * The set of environment variables used by `@console-ui` packages.
 */
export interface ConsoleEnvType {
  NODE_ENV: "development" | "production" | "test";
  VERSION: string;

  /** Controls how mock data is injected on the client */
  MOCK: string;

  /** UI upload file size limit in megabytes (MB), suffixed with "m" */
  UI_INGRESS_PROXY_BODY_SIZE: string;

  /** The listen port for the UI's server */
  PORT?: string;

  /** Target URL for the UI server's `/api` proxy */
  CONSOLE_API_URL?: string;

  /** Rekor Search */
  NEXT_PUBLIC_REKOR_DEFAULT_DOMAIN?: string;

  /** Location of branding files (relative paths computed from the project source root) */
  BRANDING?: string;

  /** Alertmanager base URL for alert routing configuration */
  CONSOLE_ALERTMANAGER_URL?: string;

  /** Prometheus base URL for alert rule evaluation */
  CONSOLE_PROMETHEUS_URL?: string;
}

/**
 * Keys in `ConsoleEnv` that are only used on the server and therefore do not
 * need to be sent to the client.
 */
export const SERVER_ENV_KEYS = ["PORT", "CONSOLE_API_URL", "BRANDING", "CONSOLE_ALERTMANAGER_URL", "CONSOLE_PROMETHEUS_URL"];

/**
 * Create a `ConsoleEnv` from a partial `ConsoleEnv` with a set of default values.
 */
export const buildConsoleEnv = ({
  NODE_ENV = "production",
  PORT,
  VERSION = "99.0.0",
  MOCK = "off",

  UI_INGRESS_PROXY_BODY_SIZE = "500m",
  CONSOLE_API_URL,
  NEXT_PUBLIC_REKOR_DEFAULT_DOMAIN,
  BRANDING,
  CONSOLE_ALERTMANAGER_URL,
  CONSOLE_PROMETHEUS_URL,
}: Partial<ConsoleEnvType> = {}): ConsoleEnvType => ({
  NODE_ENV,
  PORT,
  VERSION,
  MOCK,

  UI_INGRESS_PROXY_BODY_SIZE,
  CONSOLE_API_URL,
  NEXT_PUBLIC_REKOR_DEFAULT_DOMAIN,
  BRANDING,
  CONSOLE_ALERTMANAGER_URL,
  CONSOLE_PROMETHEUS_URL,
});

/**
 * Default values for `ConsoleEnvType`.
 */
export const CONSOLE_ENV_DEFAULTS = buildConsoleEnv();

/**
 * Current `@console-ui` environment configurations from `process.env`.
 */
export const CONSOLE_ENV = buildConsoleEnv(process.env);
