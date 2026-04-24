import { backendUrl } from "./settings";
import type {
  FileItem,
  ImageMetadata,
  RuntimeFeatureOptions,
  SortOrder,
  SortOption,
} from "@/common/types.ts";

const beDir = new URL(`${backendUrl}/`);

export async function fetchFileItems(
  sortOption: SortOption,
  sortOrder: SortOrder,
  currentPath: string,
  archive: string,
): Promise<FileItem[]> {
  const response = await fetch(
    `${beDir.href}api/list-files?sort=${sortOption}&order=${sortOrder}&path=${encodeURIComponent(
      currentPath
    )}&archive=${encodeURIComponent(archive)}`
  );
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return (await response.json())?.files ?? [];
}

export async function fetchRuntimeOptions(): Promise<RuntimeFeatureOptions> {
  const response = await fetch(`${beDir.href}api/runtime-options`);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}

export async function fetchImageMetadata(
  path: string,
  archive: string,
): Promise<ImageMetadata> {
  const response = await fetch(
    `${beDir.href}api/image-metadata?path=${encodeURIComponent(
      path
    )}&archive=${encodeURIComponent(archive)}`
  );
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}
