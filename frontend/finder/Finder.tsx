import { useAtom } from "jotai";

import ImageModal from "./ImageModal.tsx";
import TextModal from "./TextModal.tsx";
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
        <TextModal />
        <Breadcrumbs />
        <Controls />
      </div>
      <FileContainer />
    </>
  );
}
