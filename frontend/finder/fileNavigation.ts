export type FileNavigationKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown";

export const fileNavigationKeys = new Set<FileNavigationKey>([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
]);

export function isFileNavigationKey(key: string): key is FileNavigationKey {
  return fileNavigationKeys.has(key as FileNavigationKey);
}

export function nextFileFocusIndex({
  key,
  currentIndex,
  itemCount,
  columns,
}: {
  key: FileNavigationKey;
  currentIndex: number;
  itemCount: number;
  columns: number;
}) {
  const normalizedColumns = Math.max(1, Math.floor(columns));
  const nextIndex = (() => {
    switch (key) {
      case "ArrowLeft":
        return currentIndex - 1;
      case "ArrowRight":
        return currentIndex + 1;
      case "ArrowUp":
        return currentIndex - normalizedColumns;
      case "ArrowDown":
        return currentIndex + normalizedColumns;
    }
  })();

  if (nextIndex < 0 || nextIndex >= itemCount) return currentIndex;
  return nextIndex;
}
