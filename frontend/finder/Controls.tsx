import { useAtom, useAtomValue } from "jotai";
import { currentFileItemsQueryAtom, sortOptionAtom } from "./states.ts";
import type { SortOption } from "@/common/types.ts";
import { FaRedo } from "react-icons/fa";

export default function Controls() {
  const [sortOption, setSortOption] = useAtom(sortOptionAtom);
  const { refetch: refetchCurrentFileItems, isFetching } = useAtomValue(
    currentFileItemsQueryAtom
  );
  return (
    <div id="controls">
      <button
        onClick={() => !isFetching && refetchCurrentFileItems()}
        aria-disabled={isFetching}
        className="refresh-button"
        aria-label={isFetching ? "読み込み中" : "ファイル一覧を更新"}
      >
        <FaRedo className={isFetching ? "spin" : ""} />
      </button>
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
