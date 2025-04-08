import { Hono } from "hono";
import { logger } from "hono/logger";
import { etag } from "hono/etag";
import { stream } from "hono/streaming";
import { join, normalize } from "node:path/posix";
import { readdir, stat } from "node:fs/promises";
import sharp from "sharp";

const app = new Hono();

// アクセスログミドルウェア
app.use(logger());

// 画像ファイル配信 (エラーハンドリング強化版)
app.get("/images/*", etag(), async (c) => {
  const relativePath = c.req.path.replace(/^\/images\//, "");

  const filePath = join("images", relativePath);

  // セキュリティチェックと隠しファイルチェック
  if (
    filePath.includes("\\") ||
    filePath.includes("/..") ||
    filePath.split("/").some((part: string) => part.startsWith("."))
  ) {
    console.error(`Invalid path attempt: ${filePath}`);
    return c.json({ error: "File not found" }, 404);
  }

  try {
    const fileInfo = await stat(filePath);

    // 通常ファイルでない場合は404エラー
    if (!fileInfo.isFile) {
      console.error(`Not a regular file: ${filePath}`);
      return c.json({ error: "File not found" }, 404);
    }

    // ファイルの更新時刻とサイズからETag生成
    const mtime = fileInfo.mtime?.getTime();
    const fileSize = fileInfo.size;
    c.header("ETag", `"${mtime.toString(16)}-${fileSize.toString(16)}"`);

    // sharpを使ってメタデータを除去する
    const image = sharp(filePath);
    return stream(c, async (stream) => {
      await stream.write(await image.toBuffer());
    });
  } catch (err) {
    if (
      (err as any)?.code == "ENOENT" ||
      (err as any)?.message?.startsWith("Input file is missing")
    ) {
      console.error(`File not found: ${filePath}`);
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

// APIルート
app.get("/api/images", async (c) => {
  const { sort = "name", path = "" } = c.req.query();
  const fullPath = join("images", path);
  const items: any[] = [];

  // ディレクトリとファイル情報を収集 (隠しファイルは除外)
  for (const entry of await readdir(fullPath)) {
    // 隠しファイル(.で始まる)はスキップ
    if (entry.startsWith(".")) {
      continue;
    }

    const itemPath = join(fullPath, entry);
    const itemInfo = await stat(itemPath);
    const isDirectory = itemInfo.isDirectory();

    items.push({
      name: entry,
      isDirectory: isDirectory,
      modified: itemInfo.mtime?.getTime() || 0,
      size: itemInfo.size,
      path: normalize(join(path, entry)),
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

  return c.json(items);
});

// 静的ファイル配信
app.use("/*", async (c, _next) => {
  return c.json({ error: "File not found" }, 404);
});

// fetch エクスポート
export default app;
