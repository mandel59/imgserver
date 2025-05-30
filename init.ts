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
    }
  },
  strict: true,
  allowPositionals: true,
});

const imagesDir = resolve(imagesRelativeDir);

// FIXME: Change current directory to frontend/finder
// Probably a bug in Bun, the chunk paths of frontend are incorrect.
// Change the current directory to reduce the impact.
process.chdir(resolve(import.meta.dirname, "frontend/finder"));

export {
  host,
  port,
  imagesDir,
  loggingPath,
  development,
  positionals,
  keepMetadata,
};
