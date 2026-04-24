import { atomWithStorage } from "jotai/utils";
import { atomEffect } from "jotai-effect";

export type ViewMode = "grid" | "list";
export type ThumbnailSize = "small" | "medium" | "large";

export const darkModeAtom = atomWithStorage<boolean>(
  "darkMode",
  window.matchMedia("(prefers-color-scheme: dark)").matches
);

export const viewModeAtom = atomWithStorage<ViewMode>("viewMode", "grid");

export const thumbnailSizeAtom = atomWithStorage<ThumbnailSize>(
  "thumbnailSize",
  "medium"
);

export const htmlClassAtom = atomEffect((get) => {
  const darkMode = get(darkModeAtom);
  const classList = document.documentElement.classList;
  const first = !(classList.contains("dark") || classList.contains("light"));
  if (darkMode) {
    classList.add("dark");
    classList.remove("light");
  } else {
    classList.add("light");
    classList.remove("dark");
  }
  if (!first) {
    classList.add("transition");
  }
});
