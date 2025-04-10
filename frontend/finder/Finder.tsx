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
      <h1>Image Viewer</h1>
      <ImageModal />
      <Controls />
      <Breadcrumbs currentPath={currentPath} />
      <FileContainer />
    </>
  );
}
