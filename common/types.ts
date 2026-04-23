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

export type RuntimeFeatureOptions = {
  showMetadata: boolean;
};

export type ImageMetadata = {
  path: string;
  archive: string;
  name: string;
  format?: string;
  width?: number;
  height?: number;
  space?: string;
  channels?: number;
  depth?: string;
  density?: number;
  hasAlpha?: boolean;
  orientation?: number;
  pages?: number;
  size: number;
  modified: number;
};
