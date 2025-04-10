import { atom } from "jotai";
import { atomWithLocation } from "jotai-location";
import { atomWithQuery } from "jotai-tanstack-query";
import { resolve } from "path-browserify";
import { produce } from "immer";

import type { FileItem, SortOption } from "./types.ts";
import { fetchFileItems } from "./api.ts";

const locationAtom = atomWithLocation();

interface FinderSearchParam {
  path: string;
}

export const finderSearchParamAtom = atom(
  (get) => ({
    path: get(locationAtom).searchParams?.get("path") ?? "",
  }),
  (_get, set, params: FinderSearchParam) => {
    set(locationAtom, (prev) =>
      produce(prev, (location: typeof prev) => {
        location.searchParams = new URLSearchParams([["path", params.path]]);
      })
    );
  }
);

export const currentPathAtom = atom(
  (get) => get(finderSearchParamAtom).path,
  (get, set, path: string) => {
    set(
      finderSearchParamAtom,
      produce(get(finderSearchParamAtom), (draft) => {
        draft.path = path;
      })
    );
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

export const isImageModalOpenAtom = atom(false);
export const selectedImageIndexAtom = atom(-1);
export const selectedImageAtom = atom(
  (get) => get(currentImagesAtom)[get(selectedImageIndexAtom)]
);
export const currentImagesAtom = atom<FileItem[]>(
  (get) =>
    get(currentFileItemsQueryAtom).data?.files?.filter(
      (file) => file.isImage
    ) ?? []
);

export const sortOptionAtom = atom<SortOption>("name");
