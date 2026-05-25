import { useEffect } from "react";
import { basename } from "path-browserify";
import { useAtom } from "jotai";

import ImageModal from "./ImageModal.tsx";
import TextModal from "./TextModal.tsx";
import Controls from "./Controls.tsx";
import Breadcrumbs from "./Breadcrumbs.tsx";
import FileContainer, { requestFileListFocus } from "./FileContainer.tsx";
import { htmlClassAtom } from "./states/display.ts";
import { locationAtom, navigated } from "./states/location.ts";
import { navigationForParentDir } from "./locationNavigation.ts";

export default function Finder() {
  useAtom(htmlClassAtom);
  const [location, setLocation] = useAtom(locationAtom);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "ArrowUp" ||
        !event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }
      if (
        event.target instanceof Element &&
        event.target.closest("dialog[open]")
      ) {
        return;
      }

      const navigation = navigationForParentDir(location);
      if (!navigation) return;

      event.preventDefault();
      setLocation(navigated(location, navigation));
      requestFileListFocus(basename(location.path));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location, setLocation]);

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
