import { useCallback, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { FileItem } from "@/common/types.ts";
import { currentFileItemsQueryAtom, filesListAtom } from "./states/fileList.ts";
import { currentImagesAtom, onImageModalOpenAtom } from "./states/image.ts";
import { onTextModalOpenAtom } from "./states/text.ts";
import {
  type ThumbnailSize,
  thumbnailSizeAtom,
  viewModeAtom,
} from "./states/display.ts";
import {
  type Navigation,
  locationAtom,
  urlOfLocation,
  navigationForImage,
  navigationForText,
  navigationForDir,
  navigated,
} from "./states/location.ts";
import { imageResourceUrl } from "./resources.ts";
import { isFileNavigationKey, nextFileFocusIndex } from "./fileNavigation.ts";

export function IconWithName({
  icon,
  file,
  href,
  onClick,
  onKeyDown,
  children,
  width,
  height,
  metadata,
  style,
}: {
  icon: string;
  file: FileItem;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  children?: React.ReactNode;
  width: number;
  height: number;
  metadata?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const iconStyle = {
    "--thumbnail-height": `${height}px`,
    "--icon-size": `${Math.min(width, height) * 0.4}px`,
    ...style,
  } as React.CSSProperties;
  return (
    <a
      className="file-item"
      data-file-name={file.name}
      tabIndex={-1}
      href={href}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={iconStyle}
    >
      <div className="file-icon">
        {children || (
          <div style={{ fontSize: "var(--icon-size, 56px)" }}>{icon}</div>
        )}
      </div>
      <div className="file-name">{file.name}</div>
      {metadata ? <div className="file-meta">{metadata}</div> : null}
    </a>
  );
}

export function FolderIcon({
  file,
  width,
  height,
  metadata,
}: {
  file: FileItem;
  width: number;
  height: number;
  metadata?: React.ReactNode;
}) {
  const [location, setLocation] = useAtom(locationAtom);
  const onNavigate = (navigation: Navigation) => {
    setLocation(navigated(location, navigation));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      onNavigate(navigationForDir(file.path, file.archive));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
    ) {
      e.preventDefault();
      onNavigate(navigationForDir(file.path, file.archive));
    }
  };

  return (
    <IconWithName
      icon="📁"
      file={file}
      width={width}
      height={height}
      href={
        urlOfLocation(
          navigated(location, navigationForDir(file.path, file.archive))
        ).href
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      metadata={metadata}
    />
  );
}

export function ImageIcon({
  file,
  width,
  height,
  metadata,
}: {
  file: FileItem;
  width: number;
  height: number;
  metadata?: React.ReactNode;
}) {
  const location = useAtomValue(locationAtom);
  const onImageModalOpen = useSetAtom(onImageModalOpenAtom);
  const currentImages = useAtomValue(currentImagesAtom);

  const openImage = () => {
    const index = currentImages.findIndex((img) => img.path === file.path);
    if (index !== -1) {
      onImageModalOpen(file.name, index);
    }
  };

  const thumbnailUrl = imageResourceUrl(file.path, {
    archive: file.archive,
    height,
    format: "webp",
  });
  const thumbnailUrl2x = imageResourceUrl(file.path, {
    archive: file.archive,
    height: height * 2,
    format: "webp",
  });

  const handleClick = (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      openImage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
    ) {
      e.preventDefault();
      openImage();
    }
  };

  return (
    <IconWithName
      icon=""
      file={file}
      width={width}
      height={height}
      href={
        urlOfLocation(
          navigated(location, navigationForImage(file.path, file.archive))
        ).href
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      metadata={metadata}
    >
      <img
        className="file-thumbnail"
        loading="lazy"
        src={thumbnailUrl}
        srcSet={`${thumbnailUrl2x} 2x`}
      />
    </IconWithName>
  );
}

export function RegularFileIcon({
  file,
  width,
  height,
  metadata,
}: {
  file: FileItem;
  width: number;
  height: number;
  metadata?: React.ReactNode;
}) {
  return (
    <IconWithName
      icon="📄"
      file={file}
      width={width}
      height={height}
      metadata={metadata}
    />
  );
}

export function TextFileIcon({
  file,
  width,
  height,
  metadata,
}: {
  file: FileItem;
  width: number;
  height: number;
  metadata?: React.ReactNode;
}) {
  const location = useAtomValue(locationAtom);
  const onTextModalOpen = useSetAtom(onTextModalOpenAtom);

  const openText = () => {
    onTextModalOpen(file.path);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      openText();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
    ) {
      e.preventDefault();
      openText();
    }
  };

  return (
    <IconWithName
      icon="📝"
      file={file}
      width={width}
      height={height}
      href={
        urlOfLocation(
          navigated(location, navigationForText(file.path, file.archive))
        ).href
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      metadata={metadata}
    />
  );
}

export function FileIcon({
  file,
  width = 150,
  height = 150,
  metadata,
}: {
  file: FileItem;
  width?: number;
  height?: number;
  metadata?: React.ReactNode;
}) {
  if (file.isDirectory || file.isArchive)
    return (
      <FolderIcon
        file={file}
        width={width}
        height={height}
        metadata={metadata}
      />
    );
  if (file.isImage)
    return (
      <ImageIcon file={file} width={width} height={height} metadata={metadata} />
    );
  if (file.isText)
    return (
      <TextFileIcon
        file={file}
        width={width}
        height={height}
        metadata={metadata}
      />
    );
  return (
    <RegularFileIcon
      file={file}
      width={width}
      height={height}
      metadata={metadata}
    />
  );
}

const thumbnailDimensions: Record<
  ThumbnailSize,
  { cardWidth: number; gridHeight: number; listHeight: number }
> = {
  small: { cardWidth: 150, gridHeight: 110, listHeight: 48 },
  medium: { cardWidth: 200, gridHeight: 150, listHeight: 64 },
  large: { cardWidth: 260, gridHeight: 220, listHeight: 80 },
};

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;
  const fractionDigits = value >= 10 || index === 0 ? 0 : 1;
  return `${value.toFixed(fractionDigits)} ${units[index]}`;
}

function formatModifiedTime(modified: number): string {
  if (!Number.isFinite(modified) || modified <= 0) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(modified));
}

function fileItemsIn(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(".file-item"));
}

function focusedFileItemIn(container: HTMLElement) {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  const item = active.closest<HTMLElement>(".file-item");
  if (!item || !container.contains(item)) return null;
  return item;
}

function gridColumnCount(items: HTMLElement[]) {
  const firstItem = items[0];
  if (!firstItem) return 1;

  const firstTop = firstItem.offsetTop;
  const firstRowCount = items.findIndex((item) => item.offsetTop !== firstTop);
  return firstRowCount === -1 ? items.length : Math.max(1, firstRowCount);
}

function focusFileItemAt(items: HTMLElement[], index: number) {
  const item = items[index];
  if (!item) return;
  item.focus({ preventScroll: true });
  item.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function tabbableElements() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      [
        'a[href]:not([tabindex="-1"])',
        'button:not([disabled]):not([tabindex="-1"])',
        'input:not([disabled]):not([tabindex="-1"])',
        'select:not([disabled]):not([tabindex="-1"])',
        'textarea:not([disabled]):not([tabindex="-1"])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(",")
    )
  ).filter((element) => !element.closest('[aria-hidden="true"]'));
}

function focusPreviousControlBefore(container: HTMLElement) {
  const elements = tabbableElements();
  const containerIndex = elements.indexOf(container);
  if (containerIndex <= 0) return false;

  elements[containerIndex - 1]?.focus();
  return true;
}

function FileMetadata({ file }: { file: FileItem }) {
  const size = file.isDirectory ? "" : formatFileSize(file.size);
  const modified = formatModifiedTime(file.modified);
  return (
    <>
      {size ? <span>{size}</span> : null}
      {modified ? <span>{modified}</span> : null}
    </>
  );
}

export default function FileContainer() {
  const [{ isLoading }] = useAtom(currentFileItemsQueryAtom);
  const viewMode = useAtomValue(viewModeAtom);
  const thumbnailSize = useAtomValue(thumbnailSizeAtom);
  const focusedItemIndexRef = useRef(0);

  const files: FileItem[] = useAtomValue(filesListAtom);
  const dimensions = thumbnailDimensions[thumbnailSize];
  const iconHeight =
    viewMode === "grid" ? dimensions.gridHeight : dimensions.listHeight;
  const containerStyle = {
    "--grid-card-min": `${dimensions.cardWidth}px`,
  } as React.CSSProperties;

  const handleFocus = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const items = fileItemsIn(container);
    const focusedItem = focusedFileItemIn(container);

    if (focusedItem) {
      const focusedIndex = items.indexOf(focusedItem);
      if (focusedIndex !== -1) {
        focusedItemIndexRef.current = focusedIndex;
      }
      return;
    }

    if (event.target !== container || items.length === 0) return;

    const nextIndex = Math.min(focusedItemIndexRef.current, items.length - 1);
    focusFileItemAt(items, nextIndex);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const container = event.currentTarget;

      if (event.key === "Tab" && event.shiftKey) {
        const focusedItem = focusedFileItemIn(container);
        if (focusedItem && focusPreviousControlBefore(container)) {
          event.preventDefault();
        }
        return;
      }

      if (!isFileNavigationKey(event.key)) return;
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const focusedItem = focusedFileItemIn(container);
      if (!focusedItem) return;

      event.preventDefault();

      const items = fileItemsIn(container);
      const currentIndex = items.indexOf(focusedItem);
      if (currentIndex === -1) return;

      const columns = viewMode === "grid" ? gridColumnCount(items) : 1;
      const nextIndex = nextFileFocusIndex({
        key: event.key,
        currentIndex,
        itemCount: items.length,
        columns,
      });

      if (nextIndex === currentIndex) return;
      focusedItemIndexRef.current = nextIndex;
      focusFileItemAt(items, nextIndex);
    },
    [viewMode]
  );

  return (
    <div
      id="file-container"
      className={`file-container-${viewMode}`}
      style={containerStyle}
      tabIndex={0}
      aria-label="ファイル一覧"
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
    >
      {isLoading ? (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading...</div>
        </div>
      ) : null}
      {files.map((file, i) => (
        <FileIcon
          key={`${file.archive}:${file.path}:${i}`}
          file={file}
          width={dimensions.cardWidth}
          height={iconHeight}
          metadata={<FileMetadata file={file} />}
        />
      ))}
    </div>
  );
}
