import type { LocationState, Navigation } from "./states/location.ts";

function parentPathOf(path: string) {
  const parts = path.split("/").filter((part) => part.length > 0);
  parts.pop();
  return parts.join("/");
}

function archiveForParentDir(parentPath: string, archive: string) {
  if (!archive) return "";
  if (parentPath === archive || parentPath.startsWith(`${archive}/`)) {
    return archive;
  }
  return "";
}

export function navigationForParentDir(
  location: Pick<LocationState, "path" | "archive">
): Navigation | null {
  if (!location.path) return null;

  const parentPath = parentPathOf(location.path);
  return {
    path: parentPath,
    image: "",
    text: "",
    archive: archiveForParentDir(parentPath, location.archive),
    glob: "",
  };
}
