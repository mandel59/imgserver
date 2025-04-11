import { useAtom } from "jotai";
import type { FileItem } from "./types.ts";
import {
  currentFileItemsQueryAtom,
  onNavigateAtom,
  currentImagesAtom,
  onImageModalOpenAtom,
} from "./states.ts";

export function IconWithName({ icon, file }: { icon: string; file: FileItem }) {
  return (
    <div
      style={{
        width: "200px",
        height: "222px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        marginBottom: "10px",
      }}
    >
      <div
        tabIndex={0}
        style={{
          width: "180px",
          height: "180px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: "60px" }}>{icon}</div>
        <div>{file.name}</div>
      </div>
    </div>
  );
}

export function FolderIcon({ file }: { file: FileItem }) {
  const [, onNavigate] = useAtom(onNavigateAtom);
  return (
    <div
      onClick={() => {
        onNavigate(file.path);
      }}
    >
      <IconWithName icon="📁" file={file} />
    </div>
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
    <div
      style={{
        width: "200px",
        height: "222px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        marginBottom: "10px",
      }}
    >
      <div
        tabIndex={0}
        onClick={openImage}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openImage();
          }
        }}
        style={{
          width: "180px",
          height: "180px",
          position: "relative",
          margin: "0 auto",
          overflow: "hidden",
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
      </div>
      <div
        style={{
          width: "180px",
          height: "42px",
          wordWrap: "break-word",
          textAlign: "center",
          padding: "5px",
          boxSizing: "border-box",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: "2",
          WebkitBoxOrient: "vertical",
        }}
      >
        {file.name}
      </div>
    </div>
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
