import { useAtom, useAtomValue } from "jotai";
import {
  currentFileItemsQueryAtom,
  sortOptionAtom,
} from "./states/fileList.ts";
import {
  type ThumbnailSize,
  darkModeAtom,
  thumbnailSizeAtom,
  viewModeAtom,
} from "./states/display.ts";
import { globAtom } from "./states/location.ts";
import type { SortOption } from "@/common/types.ts";
import { FaRedo, FaMoon, FaSun, FaThLarge, FaList } from "react-icons/fa";

export default function Controls() {
  const [sortOption, setSortOption] = useAtom(sortOptionAtom);
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [thumbnailSize, setThumbnailSize] = useAtom(thumbnailSizeAtom);
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
        aria-label="並び順"
      >
        <option value="name">名前順</option>
        <option value="date">更新日時順</option>
      </select>
      <div className="segmented-control" role="group" aria-label="表示モード">
        <button
          type="button"
          className={viewMode === "grid" ? "active" : ""}
          onClick={() => setViewMode("grid")}
          aria-pressed={viewMode === "grid"}
          aria-label="グリッド表示"
        >
          <FaThLarge />
        </button>
        <button
          type="button"
          className={viewMode === "list" ? "active" : ""}
          onClick={() => setViewMode("list")}
          aria-pressed={viewMode === "list"}
          aria-label="リスト表示"
        >
          <FaList />
        </button>
      </div>
      <select
        id="thumbnail-size"
        value={thumbnailSize}
        onChange={(e) => setThumbnailSize(e.target.value as ThumbnailSize)}
        aria-label="サムネイルサイズ"
      >
        <option value="small">小</option>
        <option value="medium">中</option>
        <option value="large">大</option>
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
