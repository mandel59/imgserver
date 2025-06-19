import type { FileItem } from "@/common/types";
import { backendUrl } from "./settings";

const beDir = new URL(`${backendUrl}/`);

export function imageResourceUrl(
  path: string,
  options: Record<string, any> = {}
): string {
  const u = new URL(backendUrl);
  u.pathname = `/${path}`;
  u.pathname = `${beDir.pathname}images${u.pathname}`;
  for (const [key, value] of Object.entries(options)) {
    if (value == null) { continue; }
    const s = String(value);
    if (s === "") { continue; }
    u.searchParams.set(key, s);
  }
  return u.href;
}

export function imageResourceUrlForFileItem(fileItem: FileItem) {
  return imageResourceUrl(fileItem.path, {
    archive: fileItem.archive
  })
}
