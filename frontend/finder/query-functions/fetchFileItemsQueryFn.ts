import { fetchFileItems } from "../api";
import type { SortOption } from "../types";

export default function fetchFileItemsQueryFn(sortOption: SortOption, path: string) {
  return {
    queryKey: ["files", path],
    queryFn: async () => {
      const files = await fetchFileItems(sortOption, path);
      return { path, files };
    },
  };
}