import Bun from "bun";
import { Hono } from "hono";
import { join, normalize } from "node:path";
import { readdir } from "node:fs/promises";
import index from "../static/index.html" with { type: "file" };

const app = new Hono();

const staticDir = import.meta.dirname ? `${import.meta.dirname}/../static` : "static";

// アクセスログミドルウェア
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} - ${ms}ms`);
});

// 画像ファイル配信 (エラーハンドリング強化版)
app.get("/images/*", async (c) => {
  const relativePath = c.req.path.replace("/images/", "");

  // セキュリティチェックと隠しファイルチェック
  if (relativePath.includes('../') || relativePath.includes('..\\') ||
    relativePath.split('/').some((part: string) => part.startsWith('.'))) {
    console.error(`Invalid path attempt: ${relativePath}`);
    return c.json({ error: "File not found" }, 404);
  }

  const filePath = join("images", relativePath);

  try {
    const file = Bun.file(filePath);
    const stat = await file.stat();

    // 通常ファイルでない場合は404エラー
    if (!stat.isFile) {
      console.error(`Not a regular file: ${filePath}`);
      return c.json({ error: "File not found" }, 404);
    }

    const etag = `W/"${stat.mtime?.getTime().toString(16)}-${stat.size.toString(16)}"`;
    c.header("ETag", etag);

    // If-None-Matchヘッダーをチェック
    const ifNoneMatch = c.req.header("If-None-Match");
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 }); // Not Modified
    }

    return new Response(file);
  } catch (err) {
    if ((err as any)?.code == "ENOENT") {
      console.error(`File not found: ${filePath}`);
      return c.json({ error: "File not found" }, 404);
    }
    console.error(`Error processing image request for ${filePath}:`, err?.constructor, err);
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
    if (entry.startsWith('.')) {
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
      path: normalize(join(path, entry)).replace(/\\/g, '/')
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
app.use("/*", async (_c, _next) => {
  return new Response(Bun.file(index));
});

// fetch エクスポート
export default app;
