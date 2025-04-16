import { useAtom } from "jotai";
import { sortOptionAtom } from "./states.ts";
import type { SortOption } from "@/common/types.ts";

export default function Controls() {
  const [sortOption, setSortOption] = useAtom(sortOptionAtom);
  return (
    <div id="controls">
      <select
        id="sort-option"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value as SortOption)}
      >
        <option value="name">名前順</option>
        <option value="date">更新日時順</option>
      </select>
    </div>
  );
}
