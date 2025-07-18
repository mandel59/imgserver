import { resolve } from "node:path";
import { parseArgs } from "node:util";
import process from "node:process";

const {
  values: {
    host,
    port,
    dir: imagesRelativeDir,
    logging: loggingPath,
    development,
    keepMetadata,
    corsOrigin,
  },
  positionals,
} = parseArgs({
  args: process.argv,
  options: {
    host: {
      type: "string",
      short: "h",
      default: "127.0.0.1",
    },
    port: {
      type: "string",
      short: "p",
      default: "8000",
    },
    dir: {
      type: "string",
      short: "d",
      default: ".",
    },
    logging: {
      type: "string",
    },
    development: {
      type: "boolean",
      default: false,
    },
    keepMetadata: {
      "type": "boolean",
      default: false,
    },
    corsOrigin: {
      "type": "string",
      multiple: true,
      default: [],
    }
  },
  strict: true,
  allowPositionals: true,
});

const imagesDir = resolve(imagesRelativeDir);

if (!import.meta.dirname.startsWith("/$")) {
  // FIXME: Change current directory to import.meta.dirname
  // Probably a bug in Bun, the chunk paths of frontend are incorrect.
  // Change the current directory to reduce the impact.
  process.chdir(resolve(import.meta.dirname));
}

export {
  host,
  port,
  imagesDir,
  loggingPath,
  development,
  positionals,
  keepMetadata,
  corsOrigin,
};
