import { useAtom } from "jotai";
import type { FileItem } from "./types.ts";
import { currentFileItemsQueryAtom, onNavigateAtom } from "./states.ts";
import { Suspense } from "react";

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

export function ImageIcon({ file }: { file: FileItem }) {
  return <IconWithName icon="📄" file={file} />;
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
