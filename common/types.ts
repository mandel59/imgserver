export type SortOption = "name" | "date";
export type FileItem = {
  name: string;
  isDirectory: boolean;
  isImage: boolean;
  isArchive: boolean;
  modified: number;
  size: number;
  path: string;
  archive: string;
};
