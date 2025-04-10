import type { FileItem } from "./types";

export function FolderIcon({ name }: { name: string }) {
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
        <div style={{ fontSize: "60px" }}>📁</div>
        <div>{name}</div>
      </div>
    </div>
  );
}

export function RegularFileIcon({ name }: { name: string }) {
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
        <div style={{ fontSize: "60px" }}>📄</div>
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
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {name}
      </div>
    </div>
  );
}

export function FileIcon({ file }: { file: FileItem }) {
  if (file.isDirectory) return <FolderIcon name={file.name} />;
  return <RegularFileIcon name={file.name} />;
}

export default function FileContainer({ files = [] }: { files?: FileItem[] }) {
  return (
    <div id="file-container">
      {files.map((file, i) => (
        <FileIcon key={i} file={file} />
      ))}
    </div>
  );
}
