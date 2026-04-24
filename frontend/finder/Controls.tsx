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
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

type ScrollAnchor = {
  fileName: string;
  top: number;
};

function currentFileScrollAnchor(): ScrollAnchor | null {
  const headerBottom =
    document.querySelector<HTMLElement>(".header-container")
      ?.getBoundingClientRect().bottom ?? 0;
  const targetTop = headerBottom + 12;
  const items = Array.from(
    document.querySelectorAll<HTMLElement>(".file-item")
  );
  const visibleItems = items.filter((item) => {
    const rect = item.getBoundingClientRect();
    return rect.bottom > targetTop && rect.top < window.innerHeight;
  });
  const anchor =
    visibleItems
      .map((item) => {
        const rect = item.getBoundingClientRect();
        return { item, rect, distance: Math.abs(rect.top - targetTop) };
      })
      .sort((a, b) => a.distance - b.distance)[0] ?? null;
  const fileName = anchor?.item.dataset.fileName;
  if (!anchor || !fileName) return null;

  return {
    fileName,
    top: anchor.rect.top,
  };
}

function restoreFileScrollAnchor(anchor: ScrollAnchor | null) {
  if (!anchor) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const item = Array.from(
        document.querySelectorAll<HTMLElement>(".file-item")
      ).find((item) => item.dataset.fileName === anchor.fileName);
      if (!item) return;

      const nextTop = item.getBoundingClientRect().top;
      window.scrollBy(0, nextTop - anchor.top);
    });
  });
}

export default function Controls() {
  const [sortOption, setSortOption] = useAtom(sortOptionAtom);
  const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [thumbnailSize, setThumbnailSize] = useAtom(thumbnailSizeAtom);
  const [glob, setGlob] = useAtom(globAtom);
  const [openMenu, setOpenMenu] = useState<"sort" | "display" | null>(null);
  const [menuLeft, setMenuLeft] = useState<{
    sort?: number;
    display?: number;
  }>({});
  const sortMenuContainerRef = useRef<HTMLDivElement>(null);
  const displayMenuContainerRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const displayMenuRef = useRef<HTMLDivElement>(null);
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
      const menuContainer =
        openMenu === "sort"
          ? sortMenuContainerRef.current
          : displayMenuContainerRef.current;
      if (menuContainer && !menuContainer.contains(event.target as Node)) {
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

  useLayoutEffect(() => {
    if (openMenu === null) {
      setMenuLeft({});
      return;
    }

    const updateMenuPosition = () => {
      const container =
        openMenu === "sort"
          ? sortMenuContainerRef.current
          : displayMenuContainerRef.current;
      const menu =
        openMenu === "sort" ? sortMenuRef.current : displayMenuRef.current;
      if (!container || !menu) return;

      const padding = 12;
      const containerRect = container.getBoundingClientRect();
      const menuWidth = menu.offsetWidth;
      const preferredLeft = containerRect.width - menuWidth;
      const minLeft = padding - containerRect.left;
      const maxLeft =
        window.innerWidth - padding - menuWidth - containerRect.left;
      const nextLeft = Math.min(Math.max(preferredLeft, minLeft), maxLeft);
      setMenuLeft((current) =>
        current[openMenu] === nextLeft
          ? current
          : { ...current, [openMenu]: nextLeft },
      );
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    return () => window.removeEventListener("resize", updateMenuPosition);
  }, [openMenu]);

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
      <div className="sort-menu-container" ref={sortMenuContainerRef}>
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
          <span className="sort-menu-button-label">{currentSortLabel}</span>
          <span className="sort-menu-button-marker" aria-hidden="true">
            {currentSortMarker}
          </span>
        </button>
        {openMenu === "sort" && (
          <div
            className="sort-menu"
            role="group"
            aria-label="並び替え"
            ref={sortMenuRef}
            style={
              menuLeft.sort === undefined
                ? undefined
                : { left: `${menuLeft.sort}px`, right: "auto" }
            }
          >
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
      <div className="display-menu-container" ref={displayMenuContainerRef}>
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
          <div
            className="display-menu"
            role="group"
            aria-label="表示設定"
            ref={displayMenuRef}
            style={
              menuLeft.display === undefined
                ? undefined
                : { left: `${menuLeft.display}px`, right: "auto" }
            }
          >
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
                    onClick={() => {
                      if (viewMode === option.value) return;

                      const anchor = currentFileScrollAnchor();
                      setViewMode(option.value);
                      restoreFileScrollAnchor(anchor);
                    }}
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
                    onClick={() => {
                      if (thumbnailSize === option.value) return;

                      const anchor = currentFileScrollAnchor();
                      setThumbnailSize(option.value);
                      restoreFileScrollAnchor(anchor);
                    }}
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
