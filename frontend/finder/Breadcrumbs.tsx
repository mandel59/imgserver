import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
  currentArchiveAtom,
  currentPathAtom,
  locationOfDir,
  onNavigateAtom,
  updateLocation,
} from "./states.ts";
import "./Breadcrumbs.css";

export default function Breadcrumbs() {
  const path = useAtomValue(currentPathAtom);
  const archive = useAtomValue(currentArchiveAtom);
  const onNavigate = useSetAtom(onNavigateAtom);

  const handlePathClick = useCallback(
    (e: React.MouseEvent, path: string, archive: string) => {
      if (
        e.button === 0 &&
        !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
      ) {
        e.preventDefault();
        onNavigate(locationOfDir(path, archive));
      }
    },
    [onNavigate, path, archive]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, path: string, archive: string) => {
      if (
        (e.key === "Enter" || e.key === " ") &&
        !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
      ) {
        e.preventDefault();
        onNavigate(locationOfDir(path, archive));
      }
    },
    [onNavigate, path, archive]
  );

  return (
    <div className="breadcrumbs-container">
      <a
        href={updateLocation(locationOfDir("", "")).href}
        onClick={(e) => handlePathClick(e, "", "")}
        onKeyDown={(e) => handleKeyDown(e, "", "")}
        className={`breadcrumbs-link breadcrumbs-link-home ${
          path === "" ? "breadcrumbs-link-current" : ""
        }`}
        tabIndex={0}
      >
        Home
      </a>

      {path &&
        path.split("/").map((part, i) => {
          const currentPartPath = path
            .split("/")
            .slice(0, i + 1)
            .join("/");
          const currentPartArchive = currentPartPath.startsWith(archive)
            ? archive
            : "";
          return (
            <span key={currentPartPath}>
              <span className="breadcrumbs-separator">{">"}</span>
              <a
                href={
                  updateLocation(
                    locationOfDir(currentPartPath, currentPartArchive)
                  ).href
                }
                onClick={(e) =>
                  handlePathClick(e, currentPartPath, currentPartArchive)
                }
                onKeyDown={(e) =>
                  handleKeyDown(e, currentPartPath, currentPartArchive)
                }
                className={`breadcrumbs-link ${
                  currentPartPath === path ? "breadcrumbs-link-current" : ""
                }`}
                tabIndex={0}
              >
                {part}
              </a>
            </span>
          );
        })}
    </div>
  );
}
