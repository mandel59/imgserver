#!/usr/bin/env bun
import Bun from "bun";
import { name, version } from "./package.json";
import app, { listen, port } from "./backend/app.ts";
import finder from "./frontend/finder/index.html";

console.log(`${name} ${version}`);

Bun.serve({
  hostname: listen,
  port,
  routes: {
    "/": finder,
  },
  fetch: app.fetch,
});

console.log(`Server running on http://${listen}:${port}`);
