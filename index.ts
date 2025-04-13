#!/usr/bin/env bun
import Bun from "bun";
import { name, version } from "./package.json";
import app, { host, port, imagesDir } from "./backend/app.ts";
import finder from "./frontend/finder/index.html";
import { resolve } from "node:path";
import os from "node:os";
import { isIP } from "node:net";

function serverHostname() {
  let h = host;
  let m;
  if ((m = host.match(/^\[(.*)\]$/)) && isIP(m[1]!) === 6) {
    h = m[1]!;
  }
  switch (isIP(h)) {
    case 6:
      if (/^[0:]*$/.test(h)) {
        return os.hostname();
      }
      return `[${h}]`
    case 4:
      if (/^[0\.]*$/.test(h)) {
        return os.hostname();
      }
      return h;
    default:
      return h;
  }
}

function serverUrl() {
  const u = new URL("http://invalid/");
  const p = parseInt(port);
  if (!(0 < p && p <= 0xffff)) {
    throw new Error("Invalid port");
  }
  u.hostname = serverHostname();
  u.port = p.toString();
  if (u.hostname === "invalid") {
    throw new Error("Invalid host");
  }
  return u;
}

console.log(`${name} ${version}`);
console.log(`Powered by Bun ${Bun.version_with_sha}`);
console.log(`Serving images from ${resolve(imagesDir)}`);

const u = serverUrl();

const server = Bun.serve({
  hostname: u.hostname,
  port: port,
  routes: {
    "/.be/*": app.fetch,
    "/*": finder,
  },
});

console.log(`Server is running at ${u.href}`);
