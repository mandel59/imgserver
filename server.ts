import { host, port, imagesDir, development } from "./init.ts";

import Bun from "bun";
import { name, version } from "./package.json";
import app from "./backend/app.ts";
import finder from "./frontend/finder/index.html";
import os from "node:os";
import { isIP } from "node:net";

function maybeInContainer(host: string) {
  return /^[0-9a-f]{12}$/.test(host);
}

function osHostname(fallback: string) {
  const h = os.hostname();
  if (maybeInContainer(h)) {
    return fallback;
  }
  return h;
}

function serverHostname() {
  let h = host;
  let m;
  if ((m = host.match(/^\[(.*)\]$/)) && isIP(m[1]!) === 6) {
    h = m[1]!;
  }
  switch (isIP(h)) {
    case 6:
      if (/^[0:]*$/.test(h)) {
        return osHostname(`[${h}]`);
      }
      return `[${h}]`
    case 4:
      if (/^[0\.]*$/.test(h)) {
        return osHostname(h);
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

export default function serve() {
  console.log(`${name} ${version}`);
  console.log(`Powered by Bun ${Bun.version_with_sha}`);
  console.log(`Serving images from ${imagesDir}`);

  const u = serverUrl();

  const server = Bun.serve({
    hostname: host,
    port: port,
    routes: {
      "/.be/*": app.fetch,
      "/*": finder,
    },
    development,
  });

  console.log(`Server is running at ${u.href}`);

  return server;
}

if (process.argv[1] === import.meta.filename) {
  serve();
}
