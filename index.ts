#!/usr/bin/env bun
import Bun from "bun";
import { name, version } from "./package.json";
import app, { listen, port } from "./backend/app.ts";
import finder from "./frontend/finder/index.html";

console.log(`${name} ${version}`);
console.log(`Powered by Bun ${Bun.version_with_sha} at ${process.argv0}`);

Bun.serve({
  hostname: listen,
  port,
  routes: {
    "/": finder,
  },
  fetch: app.fetch,
});

console.log(`Server running on http://${listen}:${port}`);
