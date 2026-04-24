import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";

let app: { fetch: (request: Request) => Response | Promise<Response> };
let tempDir: string;
const originalArgv = [...process.argv];

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuffer, data]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(crcInput), 8 + data.length);
  return chunk;
}

function createPngTextChunk(keyword: string, text: string) {
  return createPngChunk(
    "tEXt",
    Buffer.concat([
      Buffer.from(keyword, "latin1"),
      Buffer.from([0]),
      Buffer.from(text, "latin1"),
    ]),
  );
}

function insertPngChunkBeforeIend(png: Buffer, chunk: Buffer) {
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IEND") {
      return Buffer.concat([png.subarray(0, offset), chunk, png.subarray(offset)]);
    }
    offset += 12 + length;
  }
  throw new Error("IEND chunk not found");
}

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
  const basePng = await sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: { r: 64, g: 96, b: 128 },
    },
  }).png().toBuffer();
  const commentText = "PNG comment ".repeat(2000);
  await writeFile(
    join(tempDir, "commented.png"),
    insertPngChunkBeforeIend(
      basePng,
      createPngTextChunk("Comment", commentText),
    ),
  );

  process.argv = ["bun", "test", "--dir", tempDir, "--showMetadata"];
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

const invalidResizeDimensionCases = [
  ["width", "NaN"],
  ["width", "0"],
  ["width", "-1"],
  ["width", "1.5"],
  ["width", "12px"],
  ["width", "4001"],
  ["width", ""],
  ["height", "NaN"],
  ["height", "0"],
  ["height", "-1"],
  ["height", "1.5"],
  ["height", "12px"],
  ["height", "4001"],
] as const;

for (const [parameter, value] of invalidResizeDimensionCases) {
  test(`rejects invalid image resize ${parameter}=${value}`, async () => {
    const response = await app.fetch(
      new Request(`http://localhost/.be/images/test%23img.png?${parameter}=${value}`),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid width/height parameters",
    });
  });
}

test("rejects malformed encoded image paths", async () => {
  const response = await app.fetch(
    new Request("http://localhost/.be/images/test%ZZimg.png"),
  );

  expect(response.status).toBe(404);
});

test("exposes enabled runtime feature options", async () => {
  const response = await app.fetch(
    new Request("http://localhost/.be/api/runtime-options"),
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ showMetadata: true });
});

test("returns image metadata when enabled", async () => {
  const response = await app.fetch(
    new Request(
      "http://localhost/.be/api/image-metadata?path=test%23img.png",
    ),
  );

  expect(response.status).toBe(200);
  const metadata = await response.json();
  expect(metadata.name).toBe("test#img.png");
  expect(metadata.format).toBe("png");
  expect(metadata.width).toBe(2);
  expect(metadata.height).toBe(2);
  expect(metadata.size).toBeGreaterThan(0);
});

test("returns truncated PNG text metadata", async () => {
  const response = await app.fetch(
    new Request(
      "http://localhost/.be/api/image-metadata?path=commented.png",
    ),
  );

  expect(response.status).toBe(200);
  const metadata = await response.json();
  expect(metadata.textEntries).toHaveLength(1);
  expect(metadata.textEntries[0]).toMatchObject({
    kind: "png-comment",
    label: "Comment",
    valueLength: "PNG comment ".repeat(2000).length,
    truncated: true,
  });
  expect(metadata.textEntries[0].value).toStartWith("PNG comment PNG comment");
  expect(metadata.textEntries[0].value.length).toBe(16 * 1024);
});
