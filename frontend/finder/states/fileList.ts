import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomWithStorage } from "jotai/utils";
import { minimatch } from "minimatch";

import type { SortOption, SortOrder } from "@/common/types.ts";
import { currentPathAtom, currentArchiveAtom, globAtom } from "./location.ts";
import { fetchFileItems } from "../api.ts";

export const defaultSortOrder = (sortOption: SortOption): SortOrder =>
  sortOption === "name" ? "asc" : "desc";

export const sortOptionAtom = atomWithStorage<SortOption>("sortOption", "name");
export const sortOrderAtom = atomWithStorage<SortOrder>("sortOrder", "asc");

type FileItemsQueryKey = readonly [
  "files",
  string,
  string,
  SortOption,
  SortOrder,
];

export const currentFileItemsQueryAtom = atomWithQuery((get) => {
  const sortOption = get(sortOptionAtom);
  const sortOrder = get(sortOrderAtom);
  const currentPath = get(currentPathAtom);
  const archive = get(currentArchiveAtom);
  return {
    queryKey: ["files", currentPath, archive, sortOption, sortOrder] as const,
    queryFn: async ({ queryKey }) => {
      const [, queryPath, queryArchive, querySortOption, querySortOrder] =
        queryKey as FileItemsQueryKey;
      const files = await fetchFileItems(
        querySortOption,
        querySortOrder,
        queryPath,
        queryArchive,
      );
      // 読み込み完了アニメーションが正常に再生されるよう、待機する。
      await new Promise(resolve => requestAnimationFrame(resolve));
      return { path: queryPath, files };
    },
  };
});

export const filesListAtom = atom(get => {
  const glob = get(globAtom);
  return get(currentFileItemsQueryAtom).data?.files?.filter(file => glob === "" || minimatch(file.name, `${glob}*`)) ?? [];
})
