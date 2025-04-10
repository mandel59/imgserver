import { atom } from "jotai";
import { atomWithLocation } from "jotai-location";
import { atomWithQuery } from "jotai-tanstack-query";
import { resolve } from "path-browserify";

import type { FileItem, SortOption } from "./types.ts";
import { fetchFileItems } from "./api.ts";

const locationAtom = atomWithLocation();

interface FinderSearchParam {
  path: string;
  image: string;
}

export const finderSearchParamAtom = atom(
  (get) =>
    ({
      path: get(locationAtom).searchParams?.get("path") ?? "",
      image: get(locationAtom).searchParams?.get("image") ?? "",
    } satisfies FinderSearchParam),
  (_get, set, params: FinderSearchParam) => {
    set(locationAtom, (prev) => ({
      ...prev,
      searchParams: new URLSearchParams(
        [
          ["path", params.path],
          ["image", params.image],
        ].filter(([_k, v]) => v)
      ),
    }));
  }
);

export const currentPathAtom = atom(
  (get) => get(finderSearchParamAtom).path,
  (get, set, path: string) => {
    set(finderSearchParamAtom, { ...get(finderSearchParamAtom), path });
  }
);

export const selectedImageNameAtom = atom(
  (get) => {
    return get(finderSearchParamAtom).image;
  },
  (get, set, image: string) => {
    set(finderSearchParamAtom, { ...get(finderSearchParamAtom), image });
  }
);

export const currentFileItemsQueryAtom = atomWithQuery((get) => {
  const sortOption = get(sortOptionAtom);
  const currentPath = get(currentPathAtom);
  return {
    queryKey: ["files", currentPath],
    queryFn: async (_context) => {
      const files = await fetchFileItems(sortOption, currentPath);
      return { path: currentPath, files };
    },
  };
});

export const onNavigateAtom = atom(null, (_get, set, path: string) => {
  set(currentPathAtom, resolve("/", path).slice(1));
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
    get(currentFileItemsQueryAtom).data?.files?.filter(
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
