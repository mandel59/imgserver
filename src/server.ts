import { Application, Router, Context, Next } from "oak";
import { join, normalize } from "https://deno.land/std@0.192.0/path/mod.ts";

const app = new Application();
const router = new Router();

// アクセスログミドルウェア
app.use(async (ctx: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ms}ms`);
});

// 静的ファイル配信
app.use(async (ctx: Context, next: Next) => {
  let filePath = ctx.request.url.pathname;
  if (filePath === "/") {
    filePath = "/index.html";
  }
  try {
    await ctx.send({ root: join(Deno.cwd(), "static"), path: filePath });
  } catch {
    await next();
  }
});

  // 画像ファイル配信 (エラーハンドリング強化版)
  app.use(async (ctx: Context, next: Next) => {
    if (ctx.request.url.pathname.startsWith("/images/")) {
      const relativePath = ctx.request.url.pathname.replace("/images/", "");
      
      // セキュリティチェックと隠しファイルチェック
      if (relativePath.includes('../') || relativePath.includes('..\\') || 
          relativePath.split('/').some(part => part.startsWith('.'))) {
        console.error(`Invalid path attempt: ${relativePath}`);
        ctx.response.status = 404;
        ctx.response.body = { error: "File not found" };
        return;
      }

      const filePath = join("images", relativePath);
      
      try {
        const stat = await Deno.stat(filePath);
        // 通常ファイルでない場合は404エラー
        if (!stat.isFile) {
          console.error(`Not a regular file: ${filePath}`);
          ctx.response.status = 404;
          ctx.response.body = { error: "File not found" };
          return;
        }

        const etag = `W/"${stat.mtime?.getTime().toString(16)}-${stat.size.toString(16)}"`;
        ctx.response.headers.set("ETag", etag);

        // If-None-Matchヘッダーをチェック
        const ifNoneMatch = ctx.request.headers.get("If-None-Match");
        if (ifNoneMatch === etag) {
          ctx.response.status = 304; // Not Modified
          return;
        }

        await ctx.send({ 
          root: Deno.cwd(),
          path: filePath
        });
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          console.error(`File not found: ${filePath}`);
          ctx.response.status = 404;
          ctx.response.body = { error: "File not found" };
          return;
        }
        console.error(`Error processing image request for ${filePath}:`, err);
        ctx.response.status = 500;
        ctx.response.body = { error: "Internal server error" };
      }
    } else {
      await next();
    }
  });

// APIルート
router.get("/api/images", async (ctx: Context) => {
  const sortBy = ctx.request.url.searchParams.get("sort") || "name";
  const path = ctx.request.url.searchParams.get("path") || "";
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
    switch(sortBy) {
      case "date":
        return b.modified - a.modified;
      case "size":
        return b.size - a.size;
      default: // name
        return a.name.localeCompare(b.name);
    }
  });

  ctx.response.body = items;
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
