import { useAtom } from "jotai";

import ImageModal from "./ImageModal.tsx";
import Controls from "./Controls.tsx";
import Breadcrumbs from "./Breadcrumbs.tsx";
import FileContainer from "./FileContainer.tsx";
import { htmlClassAtom } from "./states/display.ts";

export default function Finder() {
  useAtom(htmlClassAtom);
  return (
    <>
      <div className="header-container">
        <h1 className="app-header">Image Viewer</h1>
        <ImageModal />
        <Breadcrumbs />
        <Controls />
      </div>
      <FileContainer />
    </>
  );
}
