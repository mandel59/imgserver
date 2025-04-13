#!/usr/bin/env bun
import serve from "./server.ts";

const server = serve();

process.once("SIGINT", async () => {
  console.log("Received SIGINT");
  await server.stop();
  console.log("Server stopped");
});
