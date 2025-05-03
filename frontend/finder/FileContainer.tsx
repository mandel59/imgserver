import { useAtom } from "jotai";
import type { FileItem } from "@/common/types.ts";
import {
  currentFileItemsQueryAtom,
  onNavigateAtom,
  currentImagesAtom,
  onImageModalOpenAtom,
  updateLocation,
  locationOfImage,
  locationOfDir,
} from "./states.ts";
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
    </a>
  );
}

export function FolderIcon({
  file,
  width,
  height,
}: {
  file: FileItem;
  width: number;
  height: number;
}) {
  const [, onNavigate] = useAtom(onNavigateAtom);

  const handleClick = (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      onNavigate(locationOfDir(file.path, file.archive));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
    ) {
      e.preventDefault();
      onNavigate(locationOfDir(file.path, file.archive));
    }
  };

  return (
    <IconWithName
      icon="📁"
      file={file}
      width={width}
      height={height}
      href={updateLocation(locationOfDir(file.path, file.archive)).href}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    />
  );
}

export function ImageIcon({
  file,
  width,
  height,
}: {
  file: FileItem;
  width: number;
  height: number;
}) {
  const [, onImageModalOpen] = useAtom(onImageModalOpenAtom);
  const [currentImages] = useAtom(currentImagesAtom);

  const openImage = () => {
    const index = currentImages.findIndex((img) => img.path === file.path);
    if (index !== -1) {
      onImageModalOpen(file.name, index);
    }
  };

  const url = imageResourceUrl(file.path);

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
      href={updateLocation(locationOfImage(file.path, file.archive)).href}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <img
        loading="lazy"
        src={`${url}?archive=${file.archive}&height=${height}&format=webp`}
        srcSet={`${url}?archive=${file.archive}&height=${height * 2}&format=webp 2x`}
        style={{
          width: `100%`,
          height: `100%`,
          objectFit: "contain",
        }}
      />
    </IconWithName>
  );
}

export function RegularFileIcon({
  file,
  width,
  height,
}: {
  file: FileItem;
  width: number;
  height: number;
}) {
  return <IconWithName icon="📄" file={file} width={width} height={height} />;
}

export function FileIcon({
  file,
  width = 150,
  height = 150,
}: {
  file: FileItem;
  width?: number;
  height?: number;
}) {
  if (file.isDirectory || file.isArchive)
    return <FolderIcon file={file} width={width} height={height} />;
  if (file.isImage)
    return <ImageIcon file={file} width={width} height={height} />;
  return <RegularFileIcon file={file} width={width} height={height} />;
}

export default function FileContainer() {
  const [{ data, isLoading }] = useAtom(currentFileItemsQueryAtom);

  const files: FileItem[] = data?.files ?? [];

  return (
    <div id="file-container">
      {isLoading ? (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading...</div>
        </div>
      ) : null}
      {files.map((file, i) => (
        <FileIcon key={i} file={file} />
      ))}
    </div>
  );
}
