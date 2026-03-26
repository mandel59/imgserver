import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";

let app: { fetch: (request: Request) => Response | Promise<Response> };
let tempDir: string;
const originalArgv = [...process.argv];

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "imgserver-"));
  await sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: { r: 32, g: 128, b: 224 },
    },
  }).png().toFile(join(tempDir, "test#img.png"));

  process.argv = ["bun", "test", "--dir", tempDir];
  ({ default: app } = await import("./app.ts"));
});

afterAll(async () => {
  process.argv = originalArgv;
  await rm(tempDir, { recursive: true, force: true });
});

test("serves url-encoded image paths", async () => {
  const response = await app.fetch(
    new Request("http://localhost/.be/images/test%23img.png?format=webp"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("image/webp");
  expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
});

test("rejects malformed encoded image paths", async () => {
  const response = await app.fetch(
    new Request("http://localhost/.be/images/test%ZZimg.png"),
  );

  expect(response.status).toBe(404);
});
