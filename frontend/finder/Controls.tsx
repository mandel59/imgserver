import { useAtom, useAtomValue } from "jotai";
import {
  currentFileItemsQueryAtom,
  sortOptionAtom,
} from "./states/fileList.ts";
import {
  type ViewMode,
  type ThumbnailSize,
  darkModeAtom,
  thumbnailSizeAtom,
  viewModeAtom,
} from "./states/display.ts";
import { globAtom } from "./states/location.ts";
import type { SortOption } from "@/common/types.ts";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  FaRedo,
  FaMoon,
  FaSun,
  FaThLarge,
  FaList,
  FaSlidersH,
} from "react-icons/fa";

const viewModeOptions: { value: ViewMode; label: string; icon: ReactNode }[] = [
  { value: "grid", label: "グリッド", icon: <FaThLarge /> },
  { value: "list", label: "リスト", icon: <FaList /> },
];

const thumbnailSizeOptions: { value: ThumbnailSize; label: string }[] = [
  { value: "small", label: "小" },
  { value: "medium", label: "中" },
  { value: "large", label: "大" },
];

export default function Controls() {
  const [sortOption, setSortOption] = useAtom(sortOptionAtom);
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [thumbnailSize, setThumbnailSize] = useAtom(thumbnailSizeAtom);
  const [glob, setGlob] = useAtom(globAtom);
  const [isDisplayMenuOpen, setIsDisplayMenuOpen] = useState(false);
  const displayMenuRef = useRef<HTMLDivElement>(null);
  const {
    refetch: refetchCurrentFileItems,
    isFetching,
    isFetched,
  } = useAtomValue(currentFileItemsQueryAtom);

  useEffect(() => {
    if (!isDisplayMenuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (
        displayMenuRef.current &&
        !displayMenuRef.current.contains(event.target as Node)
      ) {
        setIsDisplayMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDisplayMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isDisplayMenuOpen]);

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
        <option value="size">サイズ順</option>
      </select>
      <div className="display-menu-container" ref={displayMenuRef}>
        <button
          type="button"
          className="display-menu-button"
          aria-label="表示設定"
          aria-haspopup="menu"
          aria-expanded={isDisplayMenuOpen}
          onClick={() => setIsDisplayMenuOpen((open) => !open)}
        >
          <FaSlidersH />
        </button>
        {isDisplayMenuOpen && (
          <div className="display-menu" role="group" aria-label="表示設定">
            <div className="display-menu-section">
              <div className="display-menu-label">表示形式</div>
              <div
                className="segmented-control"
                role="group"
                aria-label="表示モード"
              >
                {viewModeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={viewMode === option.value ? "active" : ""}
                    onClick={() => setViewMode(option.value)}
                    aria-pressed={viewMode === option.value}
                    aria-label={`${option.label}表示`}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="display-menu-section">
              <div className="display-menu-label">サムネイル</div>
              <div
                className="thumbnail-size-control"
                role="group"
                aria-label="サムネイルサイズ"
              >
                {thumbnailSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={thumbnailSize === option.value ? "active" : ""}
                    onClick={() => setThumbnailSize(option.value)}
                    aria-pressed={thumbnailSize === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
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
