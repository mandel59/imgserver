export interface ImageItem {
  name: string;
  path: string;
  url: string;
  size: number;
  lastModified: string;
  isDirectory: boolean;
  isImage: boolean;
  thumbnailUrl?: string;
}

export interface AppState {
  currentPath: string;
  currentImages: ImageItem[];
  currentImageIndex: number;
  scrollPositions: Record<string, number>;
}

export interface AppDependencies {
  sortOption: HTMLSelectElement;
  showModal: () => void;
  hideModal: () => void;
  modalImg: HTMLImageElement;
}
