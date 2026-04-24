export type SortOption = "name" | "date" | "size";
export type SortOrder = "asc" | "desc";
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

export type MetadataTextEntry = {
  kind: "png-comment" | "xmp";
  label: string;
  value: string;
  valueLength: number;
  truncated: boolean;
  compressed?: boolean;
  language?: string;
  translatedLabel?: string;
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
  textEntries?: MetadataTextEntry[];
};
