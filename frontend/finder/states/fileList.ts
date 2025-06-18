import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { minimatch } from "minimatch";

import type { SortOption } from "@/common/types.ts";
import { currentPathAtom, currentArchiveAtom, globAtom } from "./location.ts";
import { fetchFileItems } from "../api.ts";

export const sortOptionAtom = atom<SortOption>("name");

export const currentFileItemsQueryAtom = atomWithQuery((get) => {
  const sortOption = get(sortOptionAtom);
  const currentPath = get(currentPathAtom);
  const archive = get(currentArchiveAtom);
  return {
    queryKey: ["files", currentPath],
    queryFn: async (_context) => {
      const files = await fetchFileItems(sortOption, currentPath, archive);
      // 読み込み完了アニメーションが正常に再生されるよう、待機する。
      await new Promise(resolve => requestAnimationFrame(resolve));
      return { path: currentPath, files };
    },
  };
});

export const filesListAtom = atom(get => {
  const glob = get(globAtom);
  return get(currentFileItemsQueryAtom).data?.files?.filter(file => glob === "" || minimatch(file.name, `${glob}*`)) ?? [];
})
