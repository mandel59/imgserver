import { useAtom } from "jotai";
import type { FileItem } from "./types.ts";
import {
  currentFileItemsQueryAtom,
  onNavigateAtom,
  currentImagesAtom,
  onImageModalOpenAtom,
} from "./states.ts";
import { imageResourceUrl } from "./resources.ts";

export function IconWithName({
  icon,
  file,
  onClick,
  onKeyDown,
  children,
  width,
  height,
  style,
}: {
  icon: string;
  file: FileItem;
  onClick?: () => void;
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
    <div
      className="file-item"
      data-file-name={file.name}
      role="button"
      tabIndex={0}
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
    </div>
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

  const handleClick = () => {
    onNavigate(file.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate(file.path);
    }
  };

  return (
    <IconWithName
      icon="📁"
      file={file}
      width={width}
      height={height}
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

  return (
    <IconWithName
      icon=""
      file={file}
      width={width}
      height={height}
      onClick={openImage}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openImage();
        }
      }}
    >
      <img
        loading="lazy"
        src={`${url}?height=${height}&format=webp`}
        srcSet={`${url}?&height=${height * 2}&format=webp 2x`}
        width={width}
        height={height}
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
  if (file.isDirectory)
    return <FolderIcon file={file} width={width} height={height} />;
  if (file.isImage)
    return <ImageIcon file={file} width={width} height={height} />;
  return <RegularFileIcon file={file} width={width} height={height} />;
}

export default function FileContainer() {
  const [{ data }] = useAtom(currentFileItemsQueryAtom);

  const files: FileItem[] = data?.files ?? [];

  return (
    <div id="file-container">
      {files.map((file, i) => (
        <FileIcon key={i} file={file} />
      ))}
    </div>
  );
}
