import { Application, Router, Context, Next } from "oak";
import { join } from "https://deno.land/std@0.192.0/path/mod.ts";

const app = new Application();
const router = new Router();

// 静的ファイル配信
app.use(async (ctx: Context, next: Next) => {
  const filePath = join("static", ctx.request.url.pathname);
  try {
    await ctx.send({ root: Deno.cwd(), path: filePath });
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
  const images = [];
  
  // 画像ファイル情報を収集
  for await (const entry of Deno.readDir("images")) {
    if (entry.isFile) {
      const filePath = join("images", entry.name);
      const fileInfo = await Deno.stat(filePath);
      images.push({
        name: entry.name,
        modified: fileInfo.mtime?.getTime() || 0,
        size: fileInfo.size
      });
    }
  }

  // ソート処理
  images.sort((a, b) => {
    switch(sortBy) {
      case "date":
        return b.modified - a.modified;
      case "size":
        return b.size - a.size;
      default: // name
        return a.name.localeCompare(b.name);
    }
  });

  ctx.response.body = images.map(img => img.name);
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
