import { useAtom } from "jotai";
import type { FileItem } from "./types.ts";
import {
  currentFileItemsQueryAtom,
  onNavigateAtom,
  currentImagesAtom,
  onImageModalOpenAtom,
} from "./states.ts";
import { imageResourceUrl } from "./resources.ts";
import fetchFileItemsQueryFn from "./query-functions/fetchFileItemsQueryFn.ts";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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

export function PreviewIcon({
  file,
  width,
  height,
  images,
  onClick,
  onKeyDown,
}: {
  file: FileItem;
  width: number;
  height: number;
  images: FileItem[];
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  if (images.length === 0) {
    return (
      <IconWithName
        icon="📁"
        file={file}
        width={width}
        height={height}
        onClick={onClick}
        onKeyDown={onKeyDown}
      />
    );
  }

  const urls = images.slice(0, 4).map((image) => imageResourceUrl(image.path));

  return (
    <IconWithName
      icon=""
      file={file}
      width={width}
      height={height}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {urls.slice(0, 4).map((url, index) => (
          <div
            key={index}
            style={{
              width: "50%",
              height: "50%",
              boxSizing: "border-box",
              padding: "2px",
            }}
          >
            <img
              loading="lazy"
              src={`${url}?height=${height / 2}&format=webp`}
              srcSet={`${url}?height=${height}&format=webp 2x`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: `${Math.min(width, height) * 0.4}px`,
            pointerEvents: "none",
          }}
        >
          📁
        </div>
      </div>
    </IconWithName>
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

  const { data } = useQuery(fetchFileItemsQueryFn("name", file.path));

  const images = useMemo(() => {
    return data?.files?.filter((file) => file.isImage)?.slice(0, 4) ?? [];
  }, [data]);

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
    <PreviewIcon
      file={file}
      width={width}
      height={height}
      images={images}
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
