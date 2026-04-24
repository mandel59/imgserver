import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, stat, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import AdmZip from "adm-zip";

let app: { fetch: (request: Request) => Response | Promise<Response> };
let createTransformedImageCacheKey: typeof import("./app.ts").createTransformedImageCacheKey;
let tempDir: string;
let cacheAlternatePng: Buffer;
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

function createSolidPng(background: { r: number; g: number; b: number }) {
  return sharp({
    create: {
      width: 4,
      height: 4,
      channels: 3,
      background,
    },
  }).png({ compressionLevel: 0 }).toBuffer();
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
  await mkdir(join(tempDir, "image-dir"));
  const cacheOriginalPng = await createSolidPng({ r: 200, g: 40, b: 40 });
  cacheAlternatePng = await createSolidPng({ r: 40, g: 200, b: 40 });
  expect(cacheAlternatePng.byteLength).toBe(cacheOriginalPng.byteLength);
  await writeFile(join(tempDir, "cache.png"), cacheOriginalPng);
  const archive = new AdmZip();
  archive.addFile("first.png", basePng);
  archive.addFile("second.png", basePng);
  archive.writeZip(join(tempDir, "archive.zip"));
  const zip = new AdmZip();
  zip.addFile("UPPER.JPG", basePng);
  zip.addFile("PHOTO.PNG", basePng);
  zip.addFile("notes.txt", Buffer.from("not an image"));
  await writeFile(join(tempDir, "upper-extensions.zip"), zip.toBuffer());

  process.argv = ["bun", "test", "--dir", tempDir, "--showMetadata"];
  ({ default: app, createTransformedImageCacheKey } = await import("./app.ts"));
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

test("returns 404 for directory image paths", async () => {
  const response = await app.fetch(
    new Request("http://localhost/.be/images/image-dir"),
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

test("reuses cached transformed image buffers for unchanged source identity", async () => {
  const imagePath = join(tempDir, "cache.png");
  const originalInfo = await stat(imagePath);
  const requestUrl = "http://localhost/.be/images/cache.png?width=2&height=2&format=webp";

  const firstResponse = await app.fetch(new Request(requestUrl));
  expect(firstResponse.status).toBe(200);
  const firstBuffer = Buffer.from(await firstResponse.arrayBuffer());

  await writeFile(imagePath, cacheAlternatePng);
  await utimes(imagePath, originalInfo.atime, originalInfo.mtime);

  const secondResponse = await app.fetch(new Request(requestUrl));
  expect(secondResponse.status).toBe(200);
  const secondBuffer = Buffer.from(await secondResponse.arrayBuffer());

  expect(secondBuffer.equals(firstBuffer)).toBe(true);
});

test("builds transformed image cache keys from source identity and transform options", () => {
  const commonOptions = {
    mtime: 123,
    size: 456,
    width: 100,
    height: 80,
    fit: "inside",
    format: "webp",
    keepMetadata: false,
  };

  const regularKey = createTransformedImageCacheKey({
    ...commonOptions,
    path: "photos/item.png",
    archive: "",
    key: "",
  });
  const archiveKey = createTransformedImageCacheKey({
    ...commonOptions,
    path: "photos.zip/item.png",
    archive: "photos.zip",
    key: "item.png",
    encoding: "shift_jis",
  });
  const metadataKey = createTransformedImageCacheKey({
    ...commonOptions,
    path: "photos/item.png",
    archive: "",
    key: "",
    keepMetadata: true,
  });

  expect(regularKey).not.toBe(archiveKey);
  expect(regularKey).not.toBe(metadataKey);
  expect(JSON.parse(archiveKey)).toMatchObject({
    path: "photos.zip/item.png",
    archive: "photos.zip",
    key: "item.png",
    encoding: "shift_jis",
    mtime: 123,
    size: 456,
    width: 100,
    height: 80,
    fit: "inside",
    format: "webp",
    keepMetadata: false,
  });
});

test("uses distinct ETags for different images inside a ZIP archive", async () => {
  const firstResponse = await app.fetch(
    new Request(
      "http://localhost/.be/images/archive.zip/first.png?archive=archive.zip",
    ),
  );
  const secondResponse = await app.fetch(
    new Request(
      "http://localhost/.be/images/archive.zip/second.png?archive=archive.zip",
    ),
  );

  expect(firstResponse.status).toBe(200);
  expect(secondResponse.status).toBe(200);
  expect(firstResponse.headers.get("ETag")).toBeTruthy();
  expect(secondResponse.headers.get("ETag")).toBeTruthy();
  expect(firstResponse.headers.get("ETag")).not.toBe(
    secondResponse.headers.get("ETag"),
  );
});

test("recognizes uppercase image extensions inside ZIP archives", async () => {
  const response = await app.fetch(
    new Request(
      "http://localhost/.be/api/list-files?archive=upper-extensions.zip&path=upper-extensions.zip",
    ),
  );

  expect(response.status).toBe(200);
  const listing = await response.json();
  expect(listing.exists).toBe(true);
  expect(listing.files).toContainEqual(
    expect.objectContaining({
      name: "UPPER.JPG",
      isImage: true,
      isArchive: false,
    }),
  );
  expect(listing.files).toContainEqual(
    expect.objectContaining({
      name: "PHOTO.PNG",
      isImage: true,
      isArchive: false,
    }),
  );
  expect(listing.files).toContainEqual(
    expect.objectContaining({
      name: "notes.txt",
      isImage: false,
      isArchive: false,
    }),
  );
});
