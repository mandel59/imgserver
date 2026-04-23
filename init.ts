import process from "node:process";
import { resolveRuntimeOptions } from "./runtimeOptions.ts";

const {
  configPath,
  host,
  port,
  imagesDir,
  loggingPath,
  development,
  positionals,
  keepMetadata,
  corsOrigin,
  cacheMaxAge,
} = resolveRuntimeOptions(process.argv.slice(2));

export {
  configPath,
  host,
  port,
  imagesDir,
  loggingPath,
  development,
  positionals,
  keepMetadata,
  corsOrigin,
  cacheMaxAge,
};
