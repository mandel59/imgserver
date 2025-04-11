import { useAtom } from "jotai";
import type { FileItem } from "./types.ts";
import {
  currentFileItemsQueryAtom,
  onNavigateAtom,
  currentImagesAtom,
  onImageModalOpenAtom,
} from "./states.ts";

export function IconWithName({ 
  icon, 
  file,
  onClick,
  onKeyDown,
  children
}: { 
  icon: string; 
  file: FileItem;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  children?: React.ReactNode;
}) {
  return (
    <div 
      className="file-item" 
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div className="file-icon">
        {children || <div style={{ fontSize: "60px" }}>{icon}</div>}
      </div>
      <div className="file-name">
        {file.name}
      </div>
    </div>
  );
}

export function FolderIcon({ file }: { file: FileItem }) {
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
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    />
  );
}

type FitMode = "cover" | "contain" | "fill" | "inside" | "outside";

export function ImageIcon({
  file,
  width = 180,
  height = 180,
  fit = "cover",
}: {
  file: FileItem;
  width?: number;
  height?: number;
  fit?: FitMode;
}) {
  const [, onImageModalOpen] = useAtom(onImageModalOpenAtom);
  const [currentImages] = useAtom(currentImagesAtom);

  const openImage = () => {
    const index = currentImages.findIndex((img) => img.path === file.path);
    if (index !== -1) {
      onImageModalOpen(file.name, index);
    }
  };

  return (
    <IconWithName
      icon=""
      file={file}
      onClick={openImage}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openImage();
        }
      }}
    >
      <picture>
        <source
          srcSet={`/images/${file.path}?width=${width*2}&height=${height*2}&fit=${fit}&format=webp 2x`}
        />
        <img
          loading="lazy"
          src={`/images/${file.path}?width=${width}&height=${height}&fit=${fit}&format=webp`}
          srcSet={`/images/${file.path}?width=${width*2}&height=${height*2}&fit=${fit}&format=webp 2x`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          alt={file.name}
        />
      </picture>
    </IconWithName>
  );
}

export function RegularFileIcon({ file }: { file: FileItem }) {
  return <IconWithName icon="📄" file={file} />;
}

export function FileIcon({ file }: { file: FileItem }) {
  if (file.isDirectory) return <FolderIcon file={file} />;
  if (file.isImage) return <ImageIcon file={file} />;
  return <RegularFileIcon file={file} />;
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
