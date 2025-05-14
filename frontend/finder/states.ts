import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { atomWithLocation } from "jotai-location";
import { atomWithQuery } from "jotai-tanstack-query";
import { resolve, dirname, basename } from "path-browserify";

import type { FileItem, SortOption } from "@/common/types.ts";
import { fetchFileItems } from "./api.ts";
import { atomEffect } from "jotai-effect";

interface LocationState {
  path: string;
  image: string;
  archive: string;
}

function locationStateEquivalent(a: LocationState, b: LocationState) {
  return a.path === b.path && a.archive === b.archive;
}

export function updateLocation(location: LocationState): URL {
  const url = new URL(window.location.href);
  url.pathname = resolve("/", location.path);
  url.search = "";
  if (location.image) url.searchParams.set("image", location.image);
  if (location.archive) url.searchParams.set("archive", location.archive);
  return url;
}

export function locationOfDir(path: string, archive: string): LocationState {
  return {
    path,
    image: "",
    archive,
  }
}

export function locationOfImage(path: string, archive: string): LocationState {
  return {
    path: dirname(path),
    image: basename(path),
    archive,
  }
}

function getLocation(): LocationState {
  const u = new URL(window.location.href);
  const searchParams = u.searchParams;
  return {
    path: decodeURI(u.pathname).slice(1),
    image: searchParams?.get("image") ?? "",
    archive: searchParams?.get("archive") ?? "",
  };
}

function applyLocation(location: LocationState) {
  const currentLocation = getLocation();
  const replace = locationStateEquivalent(currentLocation, location);
  const url = updateLocation(location);
  if (replace) {
    window.history.replaceState(window.history.state, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
}

const locationAtom = atomWithLocation({ getLocation, applyLocation });

export const currentPathAtom = atom(
  (get) => get(locationAtom).path,
  (get, set, path: string) => {
    set(locationAtom, { ...get(locationAtom), path });
  }
);

export const currentArchiveAtom = atom(
  (get) => get(locationAtom).archive,
  (get, set, archive: string) => {
    set(locationAtom, { ...get(locationAtom), archive });
  }
)

export const selectedImageNameAtom = atom(
  (get) => get(locationAtom).image,
  (get, set, image: string) => {
    set(locationAtom, { ...get(locationAtom), image });
  }
);

export const currentFileItemsQueryAtom = atomWithQuery((get) => {
  const sortOption = get(sortOptionAtom);
  const currentPath = get(currentPathAtom);
  const archive = get(currentArchiveAtom);
  return {
    queryKey: ["files", currentPath],
    queryFn: async (_context) => {
      const files = await fetchFileItems(sortOption, currentPath, archive);
      return { path: currentPath, files };
    },
  };
});

export const onNavigateAtom = atom(null, (_get, set, location: LocationState) => {
  set(locationAtom, location);
});

export const isImageModalOpenAtom = atom(
  (get) => get(selectedImageNameAtom) !== "",
  (_get, set, open: boolean) => {
    if (!open) {
      set(selectedImageNameAtom, "");
    }
  }
);

export const currentImagesAtom = atom<FileItem[]>(
  (get) =>
    get(currentFileItemsQueryAtom).data?.files?.filter?.(
      (file) => file.isImage
    ) ?? []
);

export const selectedImageIndexAtom = atom<number | null>(null);

export const selectedImagePathAtom = atom((get) => {
  const path = get(currentPathAtom);
  const imageName = get(selectedImageNameAtom);
  return imageName ? `${path}/${imageName}` : "";
});

export const onImageModalOpenAtom = atom(
  null,
  (_get, set, imageName: string, index: number) => {
    set(selectedImageNameAtom, imageName);
    set(selectedImageIndexAtom, index);
  }
);

export const onShowNextImageAtom = atom(null, (get, set, delta: number) => {
  const images = get(currentImagesAtom);
  const imagePath = get(selectedImagePathAtom);
  const index =
    get(selectedImageIndexAtom) ??
    images.findIndex((file) => file.path === imagePath);

  if (images.length === 0 || index === -1) return;
  const newIndex = (index + delta + images.length) % images.length;
  const imageName = images[newIndex]?.name ?? "";

  set(selectedImageNameAtom, imageName);
  set(selectedImageIndexAtom, newIndex);
});

export const sortOptionAtom = atom<SortOption>("name");

export const darkModeAtom = atomWithStorage<boolean>(
  "darkMode",
  window.matchMedia("(prefers-color-scheme: dark)").matches
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
    classList.add("transition")
  }
})
