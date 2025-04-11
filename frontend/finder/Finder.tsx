import { useAtom } from "jotai";

import ImageModal from "./ImageModal.tsx";
import Controls from "./Controls.tsx";
import Breadcrumbs from "./Breadcrumbs.tsx";
import FileContainer from "./FileContainer.tsx";
import type { FileItem } from "./types.ts";
import { currentPathAtom, onNavigateAtom } from "./states.ts";

export default function Finder() {
  const [currentPath] = useAtom(currentPathAtom);

  return (
    <>
      <h1 className="app-header">Image Viewer</h1>
      <ImageModal />
      <Breadcrumbs currentPath={currentPath} />
      <Controls />
      <FileContainer />
    </>
  );
}
