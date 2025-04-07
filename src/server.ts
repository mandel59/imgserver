import { Application, Router, Context, Next } from "oak";
import { join } from "https://deno.land/std@0.192.0/path/mod.ts";

const app = new Application();
const router = new Router();

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

// 画像ファイル配信
app.use(async (ctx: Context, next: Next) => {
  if (ctx.request.url.pathname.startsWith("/images/")) {
    const filePath = join("images", ctx.request.url.pathname.replace("/images/", ""));
    try {
      await ctx.send({ root: Deno.cwd(), path: filePath });
    } catch {
      await next();
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
  
  // ディレクトリとファイル情報を収集
  for await (const entry of Deno.readDir(fullPath)) {
    const itemPath = join(fullPath, entry.name);
    const itemInfo = await Deno.stat(itemPath);
    
    items.push({
      name: entry.name,
      isDirectory: entry.isDirectory,
      modified: itemInfo.mtime?.getTime() || 0,
      size: itemInfo.size,
      path: join(path, entry.name)
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
