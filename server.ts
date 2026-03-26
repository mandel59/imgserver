import { host, port, imagesDir, development } from "./init.ts";

import Bun from "bun";
import { name, version } from "./package.json";
import app from "./backend/app.ts";
import {
  finderAssetUrl,
  finderHtml,
  selectFinderBuildOutputs,
} from "./finderAssets.ts";
import os from "node:os";
import { isIP } from "node:net";
import { fileURLToPath } from "node:url";

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
      return `[${h}]`;
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
  const p = parseInt(port, 10);
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

interface FinderAssets {
  html: string;
  js: Blob;
  jsType: string;
  css: Blob;
  cssType: string;
  iconPath: string;
}

async function buildFinderAssets(): Promise<FinderAssets> {
  const entrypoint = fileURLToPath(
    new URL("./frontend/finder/index.tsx", import.meta.url),
  );
  const iconPath = fileURLToPath(
    new URL("./frontend/finder/favicon.jpeg", import.meta.url),
  );

  const result = await Bun.build({
    entrypoints: [entrypoint],
    target: "browser",
    format: "esm",
    sourcemap: development ? "inline" : "none",
    minify: !development,
  });

  if (!result.success) {
    throw new AggregateError(result.logs, "Failed to build finder assets");
  }
  const outputs = selectFinderBuildOutputs(result.outputs);

  return {
    html: finderHtml(),
    js: outputs.js,
    jsType: outputs.js.type,
    css: outputs.css,
    cssType: outputs.css.type,
    iconPath,
  };
}

export default async function serve() {
  console.log(`${name} ${version}`);
  console.log(`Powered by Bun ${Bun.version_with_sha}`);
  console.log(`Serving images from ${imagesDir}`);

  const u = serverUrl();
  const finderAssets = await buildFinderAssets();

  const server = Bun.serve({
    hostname: host,
    port: port,
    routes: {
      "/.be/*": app.fetch,
      "/": () => new Response(finderAssets.html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }),
      [finderAssetUrl("index.js")]: () => new Response(finderAssets.js, {
        headers: {
          "Content-Type": finderAssets.jsType,
        },
      }),
      [finderAssetUrl("index.css")]: () => new Response(finderAssets.css, {
        headers: {
          "Content-Type": finderAssets.cssType,
        },
      }),
      [finderAssetUrl("favicon.jpeg")]: () => new Response(Bun.file(finderAssets.iconPath)),
      "/*": {
        GET: () => new Response(finderAssets.html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }),
      },
    },
    development,
  });

  console.log(`Server is running at ${u.href}`);

  return server;
}
