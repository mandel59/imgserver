import { Hono } from "hono";
import { logger } from "hono/logger";
import { etag } from "hono/etag";
import { stream } from "hono/streaming";
import { join, normalize, extname } from "node:path/posix";
import { readdir, stat } from "node:fs/promises";
import sharp from "sharp";

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

    // クエリパラメータからリサイズ設定を取得
    const width = c.req.query('width');
    const height = c.req.query('height');
    const fit = c.req.query('fit');

    // ETag生成 (リサイズパラメータがある場合は含める)
    const mtime = fileInfo.mtime?.getTime();
    const fileSize = fileInfo.size;
    let etagValue = `"${mtime.toString(16)}-${fileSize.toString(16)}"`;
    
    if (width || height || fit) {
      const paramsHash = Buffer.from(`${width}-${height}-${fit}`).toString('base64').slice(0, 8);
      etagValue = `"${mtime.toString(16)}-${fileSize.toString(16)}-${paramsHash}"`;
    }
    
    c.header("ETag", etagValue);
    
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
    const image = sharp(filePath);
    if (width || height) {
      const validFitModes = ['cover', 'contain', 'fill', 'inside', 'outside'] as const;
      const fitParam = c.req.query('fit');
      const fitMode = fitParam as typeof validFitModes[number] | undefined;
      
      if (fitParam && !validFitModes.includes(fitParam as any)) {
        return c.json({ error: `Invalid fit parameter. Valid values are: ${validFitModes.join(', ')}` }, 400);
      }
      image.resize({
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        withoutEnlargement: true, // 元画像より大きくしない
        fit: fitMode || 'inside' // アスペクト比を維持
      });
    }
    
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

  const dirPath = join("images", path);

  // セキュリティチェックと隠しファイルチェック
  if (
    dirPath.includes("\\") ||
    dirPath.includes("/..") ||
    dirPath.split("/").some((part: string) => part.startsWith("."))
  ) {
    console.error(`Invalid path attempt: ${dirPath}`);
    return c.json({ error: "File not found" }, 404);
  }

  const items: any[] = [];

  // ディレクトリとファイル情報を収集 (隠しファイルは除外)
  for (const fileName of await readdir(dirPath)) {
    // 隠しファイル(.で始まる)はスキップ
    if (fileName.startsWith(".")) {
      continue;
    }

    const ext = extname(fileName).toLowerCase();

    const filePath = join(dirPath, fileName);
    const fileInfo = await stat(filePath);
    const isDirectory = fileInfo.isDirectory();
    const isImage = imageExtensions.includes(ext);
    items.push({
      name: fileName,
      isDirectory,
      isImage,
      modified: fileInfo.mtime.getTime(),
      size: fileInfo.size,
      path: join(path, fileName),
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
