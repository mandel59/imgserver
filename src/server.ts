import Bun from "bun";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { join, normalize } from "node:path/posix";
import { readdir } from "node:fs/promises";
import sharp from "sharp";

const app = new Hono();

// アクセスログミドルウェア
app.use(logger());

// 画像ファイル配信 (エラーハンドリング強化版)
app.get("/images/*", async (c) => {
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
    const file = Bun.file(filePath);
    const stat = await file.stat();

    // 通常ファイルでない場合は404エラー
    if (!stat.isFile) {
      console.error(`Not a regular file: ${filePath}`);
      return c.json({ error: "File not found" }, 404);
    }

    const etag = `W/"${stat.mtime?.getTime().toString(16)}-${stat.size.toString(
      16
    )}"`;
    c.header("ETag", etag);

    // If-None-Matchヘッダーをチェック
    const ifNoneMatch = c.req.header("If-None-Match");
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 }); // Not Modified
    }

    // sharpを使ってメタデータを除去する
    const image = sharp(filePath);
    return new Response(await image.toBuffer());
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
    const itemInfo = await Bun.file(itemPath).stat();
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
