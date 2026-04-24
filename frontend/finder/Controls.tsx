import { useAtom, useAtomValue } from "jotai";
import {
  currentFileItemsQueryAtom,
  defaultSortOrder,
  sortOrderAtom,
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
import type { SortOption, SortOrder } from "@/common/types.ts";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  FaRedo,
  FaMoon,
  FaSun,
  FaThLarge,
  FaList,
  FaSlidersH,
  FaSortAmountDown,
} from "react-icons/fa";

const viewModeOptions: { value: ViewMode; label: string; icon: ReactNode }[] = [
  { value: "grid", label: "グリッド", icon: <FaThLarge /> },
  { value: "list", label: "リスト", icon: <FaList /> },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "name", label: "名前" },
  { value: "date", label: "更新日時" },
  { value: "size", label: "サイズ" },
];

const sortOrderOptions: { value: SortOrder; label: string; marker: string }[] = [
  { value: "asc", label: "昇順", marker: "↑" },
  { value: "desc", label: "降順", marker: "↓" },
];

const thumbnailSizeOptions: { value: ThumbnailSize; label: string }[] = [
  { value: "small", label: "小" },
  { value: "medium", label: "中" },
  { value: "large", label: "大" },
];

export default function Controls() {
  const [sortOption, setSortOption] = useAtom(sortOptionAtom);
  const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [thumbnailSize, setThumbnailSize] = useAtom(thumbnailSizeAtom);
  const [glob, setGlob] = useAtom(globAtom);
  const [openMenu, setOpenMenu] = useState<"sort" | "display" | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const {
    refetch: refetchCurrentFileItems,
    isFetching,
    isFetched,
  } = useAtomValue(currentFileItemsQueryAtom);
  const currentSortLabel =
    sortOptions.find((option) => option.value === sortOption)?.label ?? "名前";
  const currentSortMarker =
    sortOrderOptions.find((option) => option.value === sortOrder)?.marker ?? "↑";

  useEffect(() => {
    if (openMenu === null) return;

    const onPointerDown = (event: PointerEvent) => {
      if (
        controlsRef.current &&
        !controlsRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  return (
    <div id="controls" ref={controlsRef}>
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
      <div className="sort-menu-container">
        <button
          type="button"
          className="sort-menu-button"
          aria-label={`並び替え: ${currentSortLabel} ${currentSortMarker}`}
          aria-haspopup="menu"
          aria-expanded={openMenu === "sort"}
          onClick={() =>
            setOpenMenu((menu) => (menu === "sort" ? null : "sort"))
          }
        >
          <FaSortAmountDown />
          <span>{currentSortLabel}</span>
          <span aria-hidden="true">{currentSortMarker}</span>
        </button>
        {openMenu === "sort" && (
          <div className="sort-menu" role="group" aria-label="並び替え">
            <div className="display-menu-section">
              <div className="display-menu-label">対象</div>
              <div
                className="sort-option-list"
                role="group"
                aria-label="並び替え対象"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={sortOption === option.value ? "active" : ""}
                    onClick={() => {
                      setSortOption(option.value);
                      setSortOrder(defaultSortOrder(option.value));
                    }}
                    aria-pressed={sortOption === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="display-menu-section">
              <div className="display-menu-label">方向</div>
              <div
                className="sort-direction-control"
                role="group"
                aria-label="並び順"
              >
                {sortOrderOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={sortOrder === option.value ? "active" : ""}
                    onClick={() => setSortOrder(option.value)}
                    aria-pressed={sortOrder === option.value}
                  >
                    <span aria-hidden="true">{option.marker}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="display-menu-container">
        <button
          type="button"
          className="display-menu-button"
          aria-label="表示設定"
          aria-haspopup="menu"
          aria-expanded={openMenu === "display"}
          onClick={() =>
            setOpenMenu((menu) => (menu === "display" ? null : "display"))
          }
        >
          <FaSlidersH />
        </button>
        {openMenu === "display" && (
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
