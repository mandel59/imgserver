#!bun
import Bun from "bun";
import app, { listen, port } from "./backend/app";
import finder from "./frontend/finder/index.html";

Bun.serve({
  hostname: listen,
  port,
  routes: {
    "/": finder,
  },
  fetch: app.fetch,
});

console.log(`Server running on http://${listen}:${port}`);
