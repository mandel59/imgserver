import type { FileItem, SortOption } from "./types";

export async function fetchFileItems(
  sortOption: SortOption,
  currentPath: string
): Promise<FileItem[]> {
  const response = await fetch(
    `/api/images?sort=${sortOption}&path=${encodeURIComponent(currentPath)}`
  );
  return await response.json();
}
