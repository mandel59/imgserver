import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { FileItem } from "@/common/types.ts";
import { currentFileItemsQueryAtom, filesListAtom } from "./states/fileList.ts";
import { currentImagesAtom, onImageModalOpenAtom } from "./states/image.ts";
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
  navigationForDir,
  navigated,
} from "./states/location.ts";
import { imageResourceUrl } from "./resources.ts";

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
      tabIndex={0}
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

  const files: FileItem[] = useAtomValue(filesListAtom);
  const dimensions = thumbnailDimensions[thumbnailSize];
  const iconHeight =
    viewMode === "grid" ? dimensions.gridHeight : dimensions.listHeight;
  const containerStyle = {
    "--grid-card-min": `${dimensions.cardWidth}px`,
  } as React.CSSProperties;

  return (
    <div
      id="file-container"
      className={`file-container-${viewMode}`}
      style={containerStyle}
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
