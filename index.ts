#!/usr/bin/env bun
import Bun from "bun";
import { name, version } from "./package.json";
import app, { listen, port, imagesDir } from "./backend/app.ts";
import finder from "./frontend/finder/index.html";
import { resolve } from "node:path";

console.log(`${name} ${version}`);
console.log(`Powered by Bun ${Bun.version_with_sha}`);
console.log(`Serving images from ${resolve(imagesDir)}`);

const server = Bun.serve({
  hostname: listen,
  port,
  routes: {
    "/": finder,
  },
  fetch: app.fetch,
});

console.log(`Server is running at http://${server.hostname}:${server.port}`);
