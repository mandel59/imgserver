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

  const handleRootClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.button === 0 &&
        !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
      ) {
        e.preventDefault();
        onNavigate(locationOfDir("", ""));
      }
    },
    [onNavigate]
  );

  const handlePathClick = useCallback(
    (e: React.MouseEvent, path: string) => {
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
    (e: React.KeyboardEvent, path: string) => {
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
        onClick={handleRootClick}
        onKeyDown={(e) => handleKeyDown(e, "")}
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
          return (
            <span key={currentPartPath}>
              <span className="breadcrumbs-separator">{">"}</span>
              <a
                href={
                  updateLocation(
                    locationOfDir(
                      currentPartPath,
                      currentPartPath.startsWith(archive) ? archive : ""
                    )
                  ).href
                }
                onClick={(e) => handlePathClick(e, currentPartPath)}
                onKeyDown={(e) => handleKeyDown(e, currentPartPath)}
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
