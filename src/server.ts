import { Hono } from "hono";
import { join, normalize } from "https://deno.land/std@0.192.0/path/mod.ts";

const app = new Hono();

// アクセスログミドルウェア
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} - ${ms}ms`);
});

// 静的ファイル配信
app.use("/*", async (c, next) => {
  let filePath = c.req.path;
  if (filePath === "/") {
    filePath = "/index.html";
  }
  
  try {
    const file = await Deno.readFile(`./static${filePath}`);
    return new Response(file);
  } catch {
    return next();
  }
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
    const stat = await Deno.stat(filePath);
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

    const file = await Deno.readFile(filePath);
    return new Response(file);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      console.error(`File not found: ${filePath}`);
      return c.json({ error: "File not found" }, 404);
    }
    console.error(`Error processing image request for ${filePath}:`, err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// APIルート
app.get("/api/images", async (c) => {
  const { sort = "name", path = "" } = c.req.query();
  const fullPath = join("images", path);
  const items = [];
  
  // ディレクトリとファイル情報を収集 (隠しファイルは除外)
  for await (const entry of Deno.readDir(fullPath)) {
    // 隠しファイル(.で始まる)はスキップ
    if (entry.name.startsWith('.')) {
      continue;
    }
    
    const itemPath = join(fullPath, entry.name);
    const itemInfo = await Deno.stat(itemPath);
    const isDirectory = itemInfo.isDirectory;
    
    items.push({
      name: entry.name,
      isDirectory: isDirectory,
      modified: itemInfo.mtime?.getTime() || 0,
      size: itemInfo.size,
      path: normalize(join(path, entry.name)).replace(/\\/g, '/')
    });
  }

  // ソート処理 (ディレクトリを先に表示)
  items.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    switch(sort) {
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

// サーバー起動
console.log("Server running on http://localhost:8000");
Deno.serve({ port: 8000 }, app.fetch);
