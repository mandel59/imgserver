import type { ImageItem } from './types';

export async function fetchItems(
  sortOption: string,
  currentPath: string
): Promise<ImageItem[]> {
  const response = await fetch(
    `/api/images?sort=${sortOption}&path=${encodeURIComponent(currentPath)}`
  );
  return await response.json();
}
