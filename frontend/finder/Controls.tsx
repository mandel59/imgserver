import { useAtom, useAtomValue } from "jotai";
import {
  currentFileItemsQueryAtom,
  sortOptionAtom,
} from "./states/fileList.ts";
import { darkModeAtom } from "./states/display.ts";
import { globAtom } from "./states/location.ts";
import type { SortOption } from "@/common/types.ts";
import { FaRedo, FaMoon, FaSun } from "react-icons/fa";

export default function Controls() {
  const [sortOption, setSortOption] = useAtom(sortOptionAtom);
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);
  const [glob, setGlob] = useAtom(globAtom);
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
      <input
        type="text"
        id="search-glob"
        value={glob}
        onChange={(e) => setGlob(e.target.value)}
        placeholder="ファイル名検索 (例: *.jpg)"
        className="search-input"
      />
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
