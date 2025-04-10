import Controls from "./Controls.tsx";
import Breadcrumbs from "./Breadcrumbs.tsx";
import FileContainer from "./FileContainer.tsx";
import type { FileItem } from "./types.ts";

interface FinderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Finder({ currentPath, onNavigate }: FinderProps) {
  const files: FileItem[] = [
    {
      name: "file1",
      isDirectory: false,
      isImage: false,
      modified: 0,
      size: 0,
      path: "file1",
    },
  ];
  return (
    <>
      <h1>Image Viewer</h1>
      <Controls />
      <Breadcrumbs currentPath={currentPath} onNavigate={onNavigate} />
      <FileContainer files={files} />
    </>
  );
}
