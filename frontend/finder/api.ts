import { backendUrl } from "./settings";
import type { FileItem, SortOption } from "./types";

const beDir = new URL(`${backendUrl}/`);

export async function fetchFileItems(
  sortOption: SortOption,
  currentPath: string
): Promise<FileItem[]> {
  const response = await fetch(
    `${beDir.href}api/list-files?sort=${sortOption}&path=${encodeURIComponent(
      currentPath
    )}`
  );
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return (await response.json())?.files ?? [];
}
