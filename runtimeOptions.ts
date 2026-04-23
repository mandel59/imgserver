import { readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { parseArgs } from "node:util";

const optionDefinitions = {
  config: {
    type: "string",
    short: "c",
  },
  host: {
    type: "string",
    short: "h",
  },
  port: {
    type: "string",
    short: "p",
  },
  dir: {
    type: "string",
    short: "d",
  },
  logging: {
    type: "string",
  },
  development: {
    type: "boolean",
  },
  keepMetadata: {
    type: "boolean",
  },
  corsOrigin: {
    type: "string",
    multiple: true,
  },
  cacheMaxAge: {
    type: "string",
  },
} as const;

const defaultOptionValues = {
  host: "127.0.0.1",
  port: "8000",
  dir: ".",
  development: false,
  keepMetadata: false,
  corsOrigin: [] as string[],
  cacheMaxAge: "60",
} as const;

interface NormalizedConfigValues {
  host?: string;
  port?: string;
  dir?: string;
  logging?: string;
  development?: boolean;
  keepMetadata?: boolean;
  corsOrigin?: string[];
  cacheMaxAge?: string;
}

export interface RuntimeOptions {
  configPath?: string;
  host: string;
  port: string;
  imagesDir: string;
  loggingPath?: string;
  development: boolean;
  positionals: string[];
  keepMetadata: boolean;
  corsOrigin: string[];
  cacheMaxAge: number;
}

function failConfig(path: string, message: string): never {
  throw new Error(`Invalid config file ${path}: ${message}`);
}

function expectPlainObject(
  value: unknown,
  configPath: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failConfig(configPath, "top-level value must be an object");
  }
  return value as Record<string, unknown>;
}

function expectString(
  value: unknown,
  configPath: string,
  key: string,
): string {
  if (typeof value !== "string") {
    failConfig(configPath, `"${key}" must be a string`);
  }
  return value;
}

function expectBoolean(
  value: unknown,
  configPath: string,
  key: string,
): boolean {
  if (typeof value !== "boolean") {
    failConfig(configPath, `"${key}" must be a boolean`);
  }
  return value;
}

function expectStringOrNumber(
  value: unknown,
  configPath: string,
  key: string,
): string {
  if (typeof value !== "string" && typeof value !== "number") {
    failConfig(configPath, `"${key}" must be a string or number`);
  }
  return `${value}`;
}

function expectStringArray(
  value: unknown,
  configPath: string,
  key: string,
): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    failConfig(configPath, `"${key}" must be a string or string[]`);
  }
  return value;
}

function parseConfigText(configPath: string, text: string): unknown {
  switch (extname(configPath).toLowerCase()) {
    case ".json":
      return JSON.parse(text);
    case ".jsonc":
      return Bun.JSONC.parse(text);
    case ".toml":
      return Bun.TOML.parse(text);
    case ".yaml":
    case ".yml":
      return Bun.YAML.parse(text);
    default:
      failConfig(
        configPath,
        "unsupported extension; use .json, .jsonc, .toml, .yaml, or .yml",
      );
  }
}

function loadConfigValues(configPath: string): NormalizedConfigValues {
  let parsed: unknown;
  try {
    const text = readFileSync(configPath, "utf-8");
    parsed = parseConfigText(configPath, text);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid config file")) {
      throw error;
    }
    throw new Error(`Failed to read config file ${configPath}`, {
      cause: error,
    });
  }

  const raw = expectPlainObject(parsed, configPath);
  const configDir = dirname(configPath);
  const values: NormalizedConfigValues = {};

  if (Object.hasOwn(raw, "host")) {
    values.host = expectString(raw.host, configPath, "host");
  }
  if (Object.hasOwn(raw, "port")) {
    values.port = expectStringOrNumber(raw.port, configPath, "port");
  }
  if (Object.hasOwn(raw, "dir")) {
    values.dir = resolve(configDir, expectString(raw.dir, configPath, "dir"));
  }
  if (Object.hasOwn(raw, "logging")) {
    values.logging = expectString(raw.logging, configPath, "logging");
  }
  if (Object.hasOwn(raw, "development")) {
    values.development = expectBoolean(raw.development, configPath, "development");
  }
  if (Object.hasOwn(raw, "keepMetadata")) {
    values.keepMetadata = expectBoolean(raw.keepMetadata, configPath, "keepMetadata");
  }
  if (Object.hasOwn(raw, "corsOrigin")) {
    values.corsOrigin = expectStringArray(raw.corsOrigin, configPath, "corsOrigin");
  }
  if (Object.hasOwn(raw, "cacheMaxAge")) {
    values.cacheMaxAge = expectStringOrNumber(
      raw.cacheMaxAge,
      configPath,
      "cacheMaxAge",
    );
  }

  return values;
}

function parseCacheMaxAge(cacheMaxAge: string): number {
  const cacheMaxAgeNum = parseInt(cacheMaxAge, 10);
  return Number.isSafeInteger(cacheMaxAgeNum) && cacheMaxAgeNum > 0
    ? cacheMaxAgeNum
    : 0;
}

export function resolveRuntimeOptions(
  args: string[],
  cwd: string = process.cwd(),
): RuntimeOptions {
  const { values, positionals } = parseArgs({
    args,
    options: optionDefinitions,
    strict: true,
    allowPositionals: true,
    allowNegative: true,
  });

  const configPath = values.config ? resolve(cwd, values.config) : undefined;
  const configValues = configPath ? loadConfigValues(configPath) : {};

  const dir = values.dir
    ?? configValues.dir
    ?? defaultOptionValues.dir;
  const cacheMaxAge = values.cacheMaxAge
    ?? configValues.cacheMaxAge
    ?? defaultOptionValues.cacheMaxAge;

  return {
    configPath,
    host: values.host ?? configValues.host ?? defaultOptionValues.host,
    port: values.port ?? configValues.port ?? defaultOptionValues.port,
    imagesDir: resolve(cwd, dir),
    loggingPath: values.logging ?? configValues.logging,
    development: values.development
      ?? configValues.development
      ?? defaultOptionValues.development,
    positionals,
    keepMetadata: values.keepMetadata
      ?? configValues.keepMetadata
      ?? defaultOptionValues.keepMetadata,
    corsOrigin: values.corsOrigin
      ?? configValues.corsOrigin
      ?? defaultOptionValues.corsOrigin,
    cacheMaxAge: parseCacheMaxAge(cacheMaxAge),
  };
}
