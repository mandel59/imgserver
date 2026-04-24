import {
  imagesDir,
  loggingPath,
  keepMetadata,
  showMetadata,
  corsOrigin,
  cacheMaxAge,
} from "../init.ts";

import { Hono } from "hono";
import { logger } from "hono/logger";
import { etag } from "hono/etag";
import { stream } from "hono/streaming";
import { cors } from "hono/cors";
import { join, extname, basename, dirname } from "node:path/posix";
import { readFile, readdir, stat } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import sharp from "sharp";
import AdbZip from "adm-zip";
import iconv from "iconv-lite";
import type {
  FileItem,
  ImageMetadata,
  MetadataTextEntry,
  RuntimeFeatureOptions,
} from "@/common/types";

const imageExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".tif",
  ".tiff",
];

const archiveExtensions = [
  ".zip",
];

const maxMetadataTextLength = 16 * 1024;
const maxInflatedMetadataTextLength = 256 * 1024;
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const transformedImageCacheMaxEntries = 100;
const transformedImageCacheMaxBytes = 64 * 1024 * 1024;

const app = new Hono();

type TransformedImageCacheKeyOptions = {
  path: string;
  archive: string;
  key: string;
  encoding?: string;
  mtime: number;
  size: number;
  width?: string;
  height?: string;
  fit?: string;
  format?: string;
  keepMetadata: boolean;
};

type TransformedImageCacheEntry = {
  buffer: Buffer;
  size: number;
};

const transformedImageCache = new Map<string, TransformedImageCacheEntry>();
let transformedImageCacheBytes = 0;

export function createTransformedImageCacheKey(options: TransformedImageCacheKeyOptions) {
  return JSON.stringify({
    path: options.path,
    archive: options.archive,
    key: options.key,
    encoding: options.encoding,
    mtime: options.mtime,
    size: options.size,
    width: options.width,
    height: options.height,
    fit: options.fit,
    format: options.format,
    keepMetadata: options.keepMetadata,
  });
}

function getTransformedImageCache(key: string) {
  const entry = transformedImageCache.get(key);
  if (!entry) {
    return null;
  }

  transformedImageCache.delete(key);
  transformedImageCache.set(key, entry);
  return entry.buffer;
}

function pruneTransformedImageCache() {
  while (
    transformedImageCache.size > transformedImageCacheMaxEntries ||
    transformedImageCacheBytes > transformedImageCacheMaxBytes
  ) {
    const oldestKey = transformedImageCache.keys().next().value;
    if (oldestKey == null) {
      return;
    }
    const oldestEntry = transformedImageCache.get(oldestKey);
    transformedImageCache.delete(oldestKey);
    if (oldestEntry) {
      transformedImageCacheBytes -= oldestEntry.size;
    }
  }
}

function setTransformedImageCache(key: string, buffer: Buffer) {
  const existing = transformedImageCache.get(key);
  if (existing) {
    transformedImageCacheBytes -= existing.size;
    transformedImageCache.delete(key);
  }

  if (buffer.byteLength > transformedImageCacheMaxBytes) {
    pruneTransformedImageCache();
    return;
  }

  transformedImageCache.set(key, {
    buffer,
    size: buffer.byteLength,
  });
  transformedImageCacheBytes += buffer.byteLength;
  pruneTransformedImageCache();
}

function decodeImageRequestPath(path: string) {
  try {
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

function isInvalidImagePath(path: string) {
  return (
    path.includes("\0") ||
    path.includes("\\") ||
    path.split("/").some((part: string) => part.startsWith(".") || part.length === 0)
  );
}

function resolveArchiveKey(path: string, archive: string) {
  if (!path.startsWith(archive)) {
    return null;
  }

  if (path === archive) {
    return "";
  }

  if (path[archive.length] !== "/") {
    return null;
  }

  return path.slice(archive.length + 1);
}

function createMetadataTextEntry(
  kind: MetadataTextEntry["kind"],
  label: string,
  value: string,
): MetadataTextEntry {
  const truncated = value.length > maxMetadataTextLength;
  return {
    kind,
    label,
    value: truncated ? value.slice(0, maxMetadataTextLength) : value,
    valueLength: value.length,
    truncated,
  };
}

function createMetadataTextEntryFromBuffer(
  kind: MetadataTextEntry["kind"],
  label: string,
  value: Buffer,
  encoding: BufferEncoding,
): MetadataTextEntry {
  const truncated = value.length > maxMetadataTextLength;
  return {
    kind,
    label,
    value: value.subarray(0, maxMetadataTextLength).toString(encoding),
    valueLength: value.length,
    truncated,
  };
}

type PngTextEntryOptions =
  Pick<MetadataTextEntry, "compressed" | "language" | "translatedLabel"> & {
    encoding?: BufferEncoding;
  };

function createPngTextEntry(
  label: string,
  value: string | Buffer,
  options: PngTextEntryOptions = {},
) {
  const { encoding = "utf8", ...entryOptions } = options;
  const entry = Buffer.isBuffer(value)
    ? createMetadataTextEntryFromBuffer(
      "png-comment",
      label || "Comment",
      value,
      encoding,
    )
    : createMetadataTextEntry("png-comment", label || "Comment", value);
  return {
    ...entry,
    ...entryOptions,
  };
}

function splitPngKeyword(data: Buffer) {
  const keywordEnd = data.indexOf(0);
  if (keywordEnd <= 0) {
    return null;
  }
  return {
    keyword: data.subarray(0, keywordEnd).toString("latin1"),
    restOffset: keywordEnd + 1,
  };
}

function inflatePngText(data: Buffer) {
  return inflateSync(data, { maxOutputLength: maxInflatedMetadataTextLength });
}

function parsePngTextEntries(buffer: Buffer): MetadataTextEntry[] {
  if (buffer.length < pngSignature.length || !buffer.subarray(0, 8).equals(pngSignature)) {
    return [];
  }

  const entries: MetadataTextEntry[] = [];
  let offset = pngSignature.length;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const nextOffset = dataEnd + 4;
    if (dataEnd > buffer.length || nextOffset > buffer.length) {
      break;
    }

    const type = buffer.subarray(typeStart, typeStart + 4).toString("ascii");
    const data = buffer.subarray(dataStart, dataEnd);

    try {
      switch (type) {
        case "tEXt": {
          const split = splitPngKeyword(data);
          if (split) {
            entries.push(
              createPngTextEntry(
                split.keyword,
                data.subarray(split.restOffset),
                { encoding: "latin1" },
              ),
            );
          }
          break;
        }
        case "zTXt": {
          const split = splitPngKeyword(data);
          if (split && data[split.restOffset] === 0) {
            entries.push(
              createPngTextEntry(
                split.keyword,
                inflatePngText(data.subarray(split.restOffset + 1)),
                { compressed: true, encoding: "latin1" },
              ),
            );
          }
          break;
        }
        case "iTXt": {
          const split = splitPngKeyword(data);
          if (!split) {
            break;
          }
          const compressionFlag = data[split.restOffset];
          const compressionMethod = data[split.restOffset + 1];
          if (
            (compressionFlag !== 0 && compressionFlag !== 1) ||
            (compressionFlag === 1 && compressionMethod !== 0)
          ) {
            break;
          }
          let cursor = split.restOffset + 2;
          const languageEnd = data.indexOf(0, cursor);
          if (languageEnd === -1) {
            break;
          }
          const language = data.subarray(cursor, languageEnd).toString("ascii");
          cursor = languageEnd + 1;
          const translatedKeywordEnd = data.indexOf(0, cursor);
          if (translatedKeywordEnd === -1) {
            break;
          }
          const translatedLabel = data.subarray(cursor, translatedKeywordEnd).toString("utf8");
          const textBuffer = data.subarray(translatedKeywordEnd + 1);
          const value = compressionFlag === 1
            ? inflatePngText(textBuffer)
            : textBuffer;
          entries.push(
            createPngTextEntry(split.keyword, value, {
              compressed: compressionFlag === 1,
              encoding: "utf8",
              language: language || undefined,
              translatedLabel: translatedLabel || undefined,
            }),
          );
          break;
        }
      }
    } catch {
      // Skip malformed text chunks and continue reading other metadata.
    }

    offset = nextOffset;
  }

  return entries;
}

function getMetadataTextEntries(
  metadata: sharp.Metadata,
  inputBuffer?: Buffer,
): MetadataTextEntry[] {
  const entries = inputBuffer
    ? parsePngTextEntries(inputBuffer)
    : metadata.comments?.map((comment) => {
      return createMetadataTextEntry(
        "png-comment",
        comment.keyword || "Comment",
        comment.text,
      );
    }) ?? [];

  if (metadata.xmpAsString) {
    entries.push(createMetadataTextEntry("xmp", "XMP", metadata.xmpAsString));
  }

  return entries;
}

function toImageMetadata(
  path: string,
  archive: string,
  size: number,
  modified: number,
  metadata: sharp.Metadata,
  inputBuffer?: Buffer,
): ImageMetadata {
  const textEntries = getMetadataTextEntries(metadata, inputBuffer);
  const result: ImageMetadata = {
    path,
    archive,
    name: basename(path),
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    space: metadata.space,
    channels: metadata.channels,
    depth: metadata.depth,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
    pages: metadata.pages,
    size,
    modified,
  };

  if (textEntries.length > 0) {
    result.textEntries = textEntries;
  }

  return result;
}

if (loggingPath) {
  // アクセスログミドルウェア
  app.use(loggingPath, logger());
}

if (corsOrigin.length > 0) {
  app.use("/.be/images/*", cors({
    origin: corsOrigin.includes("*") ? "*" : corsOrigin,
    allowMethods: ["GET", "OPTIONS"],
    exposeHeaders: ["*"],
  }))
}

// 画像ファイル配信 (エラーハンドリング強化版)
app.get("/.be/images/*", etag(), async (c) => {
  const { archive = "", encoding = "shift_jis" } = c.req.query();
  const rawPath = c.req.path.replace(/^\/\.be\/images\//, "");
  const path = decodeImageRequestPath(rawPath);

  if (path == null) {
    console.error(`Invalid encoded path attempt: ${rawPath}`);
    return c.json({ error: "File not found" }, 404);
  }

  // セキュリティチェックと隠しファイルチェック
  if (
    isInvalidImagePath(path)
  ) {
    console.error(`Invalid path attempt: ${path}`);
    return c.json({ error: "File not found" }, 404);
  }

  let buffer: Buffer | null = null;
  let header: AdbZip.EntryHeader | null = null;
  let mtime: number = 0;
  let fileSize: number = 0;
  let archiveKey = "";
  if (archive) {
    const key = resolveArchiveKey(path, archive);
    if (key == null) {
      console.error(`Invalid path attempt: ${path}`);
      return c.json({ error: "File not found" }, 404);
    }
    archiveKey = key;

    const archivePath = join(imagesDir, archive);

    const zip = new AdbZip(archivePath);

    const rawKey = iconv.encode(key, encoding).toString("utf-8");

    header = zip.getEntry(rawKey)?.header ?? null;
    buffer = zip.readFile(rawKey) ?? null;
    if (!header || !buffer) {
      return c.json({ error: "File not found" }, 404);
    }
    mtime = header?.time?.getTime() ?? 0;
  }

  const filePath = join(imagesDir, path);

  try {
    if (!archive) {
      const fileInfo = await stat(filePath);

      // 通常ファイルでない場合は404エラー
      if (!fileInfo.isFile) {
        console.error(`Not a regular file: ${filePath}`);
        return c.json({ error: "File not found" }, 404);
      }
      mtime = fileInfo.mtime.getTime();
      fileSize = fileInfo.size;
    }

    // クエリパラメータからリサイズ設定を取得
    const width = c.req.query("width");
    const height = c.req.query("height");
    const fit = c.req.query("fit");
    const format = c.req.query("format");

    const validFormats = ["png", "jpeg", "webp", "avif"] as const;
    if (format && !validFormats.includes(format as any)) {
      return c.json(
        {
          error: `Invalid format parameter. Valid values are: ${validFormats.join(
            ", "
          )}`,
        },
        400
      );
    }

    // リサイズパラメータのバリデーション
    if (width || height) {
      const numWidth = width ? parseInt(width) : undefined;
      const numHeight = height ? parseInt(height) : undefined;

      if (
        (numWidth && (isNaN(numWidth) || numWidth <= 0 || numWidth > 4000)) ||
        (numHeight && (isNaN(numHeight) || numHeight <= 0 || numHeight > 4000))
      ) {
        return c.json({ error: "Invalid width/height parameters" }, 400);
      }
    }

    // sharpを使ってメタデータを除去し、必要に応じてリサイズ
    const image = buffer ? sharp(buffer, {}) : sharp(filePath);
    const metadata = await image.metadata();
    const originalFormat = metadata.format;

    if (keepMetadata) {
      image.keepMetadata()
    }

    // ETag生成 (リサイズパラメータがある場合は含める)
    let etagValue = `${mtime.toString(16)}-${fileSize.toString(16)}`;

    if (keepMetadata) {
      etagValue += "-km"
    }

    if (width || height || fit || format) {
      const paramsHash = Buffer.from(
        JSON.stringify({
          width: width || undefined,
          height: height || undefined,
          fit: fit || undefined,
          format: format || undefined,
        })
      ).toString("hex");

      etagValue = `${mtime.toString(16)}-${fileSize.toString(
        16
      )}-${paramsHash}`;
    }

    c.header("ETag", `"${etagValue}"`);

    if (cacheMaxAge > 0) {
      c.header("Cache-Control", `max-age=${cacheMaxAge}, immutable`);
    }

    if (width || height) {
      const validFitModes = [
        "cover",
        "contain",
        "fill",
        "inside",
        "outside",
      ] as const;
      const fitParam = c.req.query("fit");
      const fitMode = fitParam as (typeof validFitModes)[number] | undefined;

      if (fitParam && !validFitModes.includes(fitParam as any)) {
        return c.json(
          {
            error: `Invalid fit parameter. Valid values are: ${validFitModes.join(
              ", "
            )}`,
          },
          400
        );
      }
      image.resize({
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        withoutEnlargement: true, // 元画像より大きくしない
        fit: fitMode || "inside", // アスペクト比を維持
      });
    }

    // フォーマット変換とContent-Type設定
    if (format) {
      image.toFormat(format as any);
    }

    switch (format || originalFormat) {
      case "png":
        c.header("Content-Type", "image/png");
        break;
      case "jpeg":
        c.header("Content-Type", "image/jpeg");
        break;
      case "webp":
        c.header("Content-Type", "image/webp");
        break;
      case "avif":
        c.header("Content-Type", "image/avif");
        break;
      case "gif":
        c.header("Content-Type", "image/gif");
        break;
      case "tiff":
        c.header("Content-Type", "image/tiff");
        break;
      default:
        // デフォルトは元のフォーマットを維持
        break;
    }

    const transformedImageCacheKey = createTransformedImageCacheKey({
      path,
      archive,
      key: archiveKey,
      encoding: archive ? encoding : undefined,
      mtime,
      size: archive ? (header?.size ?? buffer?.byteLength ?? 0) : fileSize,
      width: width || undefined,
      height: height || undefined,
      fit: fit || undefined,
      format: format || undefined,
      keepMetadata,
    });
    const cachedBuffer = getTransformedImageCache(transformedImageCacheKey);
    if (cachedBuffer) {
      return stream(c, async (stream) => {
        await stream.write(cachedBuffer);
      });
    }

    return stream(c, async (stream) => {
      const outputBuffer = await image.toBuffer();
      setTransformedImageCache(transformedImageCacheKey, outputBuffer);
      await stream.write(outputBuffer);
    });
  } catch (err) {
    if (
      (err as any)?.code == "ENOENT" ||
      (err as any)?.message?.startsWith("Input file is missing")
    ) {
      return c.json({ error: "File not found" }, 404);
    }
    console.error(
      `Error processing image request for ${filePath}:`,
      err?.constructor,
      err
    );
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/.be/api/runtime-options", (c) => {
  const options: RuntimeFeatureOptions = {
    showMetadata,
  };
  return c.json(options);
});

app.get("/.be/api/image-metadata", async (c) => {
  if (!showMetadata) {
    return c.json({ error: "File not found" }, 404);
  }

  const { path = "", archive = "", encoding = "shift_jis" } = c.req.query();

  if (path === "" || isInvalidImagePath(path)) {
    console.error(`Invalid path attempt: ${path}`);
    return c.json({ error: "File not found" }, 404);
  }

  try {
    if (archive) {
      const key = resolveArchiveKey(path, archive);
      if (key == null) {
        console.error(`Invalid path attempt: ${path}`);
        return c.json({ error: "File not found" }, 404);
      }

      const archivePath = join(imagesDir, archive);
      const zip = new AdbZip(archivePath);
      const rawKey = iconv.encode(key, encoding).toString("utf-8");
      const header = zip.getEntry(rawKey)?.header ?? null;
      const buffer = zip.readFile(rawKey) ?? null;
      if (!header || !buffer) {
        return c.json({ error: "File not found" }, 404);
      }

      const metadata = await sharp(buffer, {}).metadata();
      return c.json(
        toImageMetadata(
          path,
          archive,
          header.size,
          header.time?.getTime() ?? 0,
          metadata,
          buffer,
        ),
      );
    }

    const filePath = join(imagesDir, path);
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      console.error(`Not a regular file: ${filePath}`);
      return c.json({ error: "File not found" }, 404);
    }

    const pngBuffer = extname(path).toLowerCase() === ".png"
      ? await readFile(filePath)
      : undefined;
    const metadata = pngBuffer
      ? await sharp(pngBuffer, {}).metadata()
      : await sharp(filePath).metadata();
    return c.json(
      toImageMetadata(
        path,
        archive,
        fileInfo.size,
        fileInfo.mtime.getTime(),
        metadata,
        pngBuffer,
      ),
    );
  } catch (err) {
    if (
      (err as any)?.code == "ENOENT" ||
      (err as any)?.message?.startsWith("Input file is missing")
    ) {
      return c.json({ error: "File not found" }, 404);
    }
    console.error(
      `Error processing image-metadata request for ${path}:`,
      err?.constructor,
      err
    );
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ファイル一覧取得API
app.get("/.be/api/list-files", async (c) => {
  const { sort = "name", path = "", archive = "", encoding = "shift_jis" } = c.req.query();

  // セキュリティチェックと隠しファイルチェック
  if (
    path.includes("\0") ||
    path.includes("\\") ||
    (path !== "" && path.split("/").some((part: string) => part.startsWith(".") || part.length === 0))
  ) {
    console.error(`Invalid path attempt: ${path}`);
    return c.json({ exists: false, files: [] });
  }

  if (archive) {
    const key = resolveArchiveKey(path, archive);
    if (key == null) {
      console.error(`Invalid path attempt: ${path}`);
      return c.json({ exists: false, files: [] });
    }

    const archivePath = join(imagesDir, archive);

    const items: FileItem[] = [];

    const zip = new AdbZip(archivePath);
    for (const entry of zip.getEntries()) {
      const entryName = iconv.decode(entry.rawEntryName, encoding);
      const dir = dirname(entryName);
      if (key === "" && dir !== ".") continue;
      if (key !== "" && key !== dir) continue;
      const file = basename(entryName);
      const isDirectory = entryName.endsWith("/");
      const ext = extname(file);
      const isImage = imageExtensions.includes(ext);
      const isArchive = false;
      items.push({
        name: file,
        isDirectory,
        isImage,
        isArchive,
        modified: entry.header.time.getTime(),
        size: entry.header.size,
        path: join(archive, dir, file),
        archive,
      });
    }

    // ソート処理 (ディレクトリを先に表示)
    items.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      switch (sort) {
        case "date":
          return b.modified - a.modified;
        case "size":
          return b.size - a.size;
        default: // name
          return a.name.localeCompare(b.name);
      }
    });

    return c.json({ exists: true, files: items });
  }

  const dirPath = join(imagesDir, path);

  const items: FileItem[] = [];

  try {
    // ディレクトリとファイル情報を収集 (隠しファイルは除外)
    for (const fileName of await readdir(dirPath)) {
      // 隠しファイル(.で始まる)と名前に`\`を含むファイルはスキップ
      if (/^\.|\\/g.test(fileName)) {
        continue;
      }

      const ext = extname(fileName).toLowerCase();

      const fsFilePath = join(dirPath, fileName);
      try {
        const fileInfo = await stat(fsFilePath);
        const isDirectory = fileInfo.isDirectory();
        const isImage = imageExtensions.includes(ext);
        const isArchive = archiveExtensions.includes(ext);
        const filePath = join(path, fileName);
        items.push({
          name: fileName,
          isDirectory,
          isImage,
          isArchive,
          modified: fileInfo.mtime.getTime(),
          size: fileInfo.size,
          path: filePath,
          archive: isArchive ? filePath : archive,
        });
      } catch (err) {
        if (
          (err as any)?.code == "ENOENT" ||
          (err as any)?.message?.startsWith("Input file is missing")
        ) {
          items.push({
            name: fileName,
            isDirectory: false,
            isImage: false,
            isArchive: false,
            modified: 0,
            size: 0,
            path: join(path, fileName),
            archive,
          });
          continue;
        }
        throw err;
      }
    }
  } catch (err) {
    if (
      (err as any)?.code == "ENOENT" ||
      (err as any)?.message?.startsWith("Input file is missing")
    ) {
      return c.json({ exists: false, files: [] }, 200);
    }
    console.error(
      `Error processing list-files request for ${dirPath}:`,
      err?.constructor,
      err
    );
    return c.json({ error: "Internal server error" }, 500);
  }

  // ソート処理 (ディレクトリを先に表示)
  items.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    switch (sort) {
      case "date":
        return b.modified - a.modified;
      case "size":
        return b.size - a.size;
      default: // name
        return a.name.localeCompare(b.name);
    }
  });

  return c.json({ exists: true, files: items });
});

// 静的ファイル配信
app.use("/*", async (c, _next) => {
  return c.json({ error: "File not found" }, 404);
});

// fetch エクスポート
export default app;
