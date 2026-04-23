import { expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveRuntimeOptions } from "./runtimeOptions.ts";

test("loads runtime options from config file", async () => {
  const baseDir = await mkdtemp(join(tmpdir(), "imgserver-config-"));

  try {
    const configDir = join(baseDir, "config");
    await mkdir(join(configDir, "images"), { recursive: true });
    const configPath = join(configDir, "imgserver.toml");
    await writeFile(
      configPath,
      [
        'host = "0.0.0.0"',
        "port = 9001",
        'dir = "./images"',
        'logging = "/.be/api/*"',
        "development = true",
        "keepMetadata = true",
        "showMetadata = true",
        'corsOrigin = ["https://example.com", "https://example.org"]',
        "cacheMaxAge = 300",
      ].join("\n"),
    );

    const options = resolveRuntimeOptions(["--config", configPath], baseDir);

    expect(options.configPath).toBe(configPath);
    expect(options.host).toBe("0.0.0.0");
    expect(options.port).toBe("9001");
    expect(options.imagesDir).toBe(join(configDir, "images"));
    expect(options.loggingPath).toBe("/.be/api/*");
    expect(options.development).toBe(true);
    expect(options.keepMetadata).toBe(true);
    expect(options.showMetadata).toBe(true);
    expect(options.corsOrigin).toEqual([
      "https://example.com",
      "https://example.org",
    ]);
    expect(options.cacheMaxAge).toBe(300);
  } finally {
    await rm(baseDir, { recursive: true, force: true });
  }
});

test("cli arguments override config file values", async () => {
  const baseDir = await mkdtemp(join(tmpdir(), "imgserver-config-"));

  try {
    const configPath = join(baseDir, "imgserver.yaml");
    await writeFile(
      configPath,
      [
        'host: "0.0.0.0"',
        'port: "9001"',
        'dir: "./from-config"',
        "development: true",
        "keepMetadata: true",
        "showMetadata: true",
        'corsOrigin: ["https://example.com"]',
        "cacheMaxAge: 300",
      ].join("\n"),
    );

    const options = resolveRuntimeOptions(
      [
        "--config",
        configPath,
        "--host",
        "127.0.0.1",
        "--port",
        "7777",
        "--dir",
        "./from-cli",
        "--no-development",
        "--no-keepMetadata",
        "--no-showMetadata",
        "--corsOrigin",
        "https://cli.example",
        "--cacheMaxAge",
        "15",
      ],
      baseDir,
    );

    expect(options.host).toBe("127.0.0.1");
    expect(options.port).toBe("7777");
    expect(options.imagesDir).toBe(join(baseDir, "from-cli"));
    expect(options.development).toBe(false);
    expect(options.keepMetadata).toBe(false);
    expect(options.showMetadata).toBe(false);
    expect(options.corsOrigin).toEqual(["https://cli.example"]);
    expect(options.cacheMaxAge).toBe(15);
  } finally {
    await rm(baseDir, { recursive: true, force: true });
  }
});
