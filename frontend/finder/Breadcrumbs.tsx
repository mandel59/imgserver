import { useAtom } from "jotai";
import { useCallback } from "react";
import { currentPathAtom, onNavigateAtom } from "./states.ts";
import "./Breadcrumbs.css";

export default function Breadcrumbs() {
  const [currentPath] = useAtom(currentPathAtom);

  const [, onNavigate] = useAtom(onNavigateAtom);

  const handleRootClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onNavigate("");
    },
    [onNavigate]
  );

  const handlePathClick = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.preventDefault();
      onNavigate(path);
    },
    [onNavigate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, path: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNavigate(path);
      }
    },
    [onNavigate]
  );

  return (
    <div className="breadcrumbs-container">
      <a
        href="?path="
        onClick={handleRootClick}
        onKeyDown={(e) => handleKeyDown(e, "")}
        className={`breadcrumbs-link breadcrumbs-link-home ${
          currentPath === "" ? "breadcrumbs-link-current" : ""
        }`}
        tabIndex={0}
      >
        Home
      </a>

      {currentPath &&
        currentPath.split("/").map((part, i) => {
          const currentPartPath = currentPath
            .split("/")
            .slice(0, i + 1)
            .join("/");
          return (
            <span key={currentPartPath}>
              <span className="breadcrumbs-separator">{">"}</span>
              <a
                href={`?path=${encodeURIComponent(currentPartPath)}`}
                onClick={(e) => handlePathClick(e, currentPartPath)}
                onKeyDown={(e) => handleKeyDown(e, currentPartPath)}
                className={`breadcrumbs-link ${
                  currentPartPath === currentPath
                    ? "breadcrumbs-link-current"
                    : ""
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
