import { useAtom, useAtomValue } from "jotai";
import {
  currentFileItemsQueryAtom,
  sortOptionAtom,
  darkModeAtom,
} from "./states.ts";
import type { SortOption } from "@/common/types.ts";
import { FaRedo, FaMoon, FaSun } from "react-icons/fa";

export default function Controls() {
  const [sortOption, setSortOption] = useAtom(sortOptionAtom);
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);
  const {
    refetch: refetchCurrentFileItems,
    isFetching,
    isFetched,
  } = useAtomValue(currentFileItemsQueryAtom);
  return (
    <div id="controls">
      <button
        onClick={() => !isFetching && refetchCurrentFileItems()}
        aria-disabled={isFetching}
        className={`refresh-button ${
          isFetching ? "fetching" : isFetched ? "fetched" : ""
        }`}
        aria-label={isFetching ? "読み込み中" : "ファイル一覧を更新"}
      >
        <FaRedo className="spin" />
      </button>
      <select
        id="sort-option"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value as SortOption)}
      >
        <option value="name">名前順</option>
        <option value="date">更新日時順</option>
      </select>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="dark-mode-toggle"
        aria-label={
          darkMode ? "ライトモードに切り替え" : "ダークモードに切り替え"
        }
      >
        {darkMode ? <FaMoon /> : <FaSun />}
      </button>
    </div>
  );
}
