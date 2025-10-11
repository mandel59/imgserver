import { atom } from "jotai";
import type { FileItem } from "@/common/types.ts";
import { currentPathAtom, selectedImageNameAtom } from "./location.ts";
import { filesListAtom } from "./fileList.ts";

export const isImageModalOpenAtom = atom(
  (get) => get(selectedImageNameAtom) !== "",
  (_get, set, open: boolean) => {
    if (!open) {
      set(selectedImageNameAtom, "");
    }
  }
);

export const currentImagesAtom = atom<FileItem[]>(
  (get) => get(filesListAtom).filter((file) => file.isImage)
);

export const selectedImageIndexAtom = atom((get) => {
  const images = get(currentImagesAtom);
  const imagePath = get(selectedImagePathAtom);
  const index = images.findIndex((file) => file.path === imagePath);
  if (index === -1) {
    return undefined
  }
  return index
});

export const selectedImagePathAtom = atom((get) => {
  const path = get(currentPathAtom);
  const imageName = get(selectedImageNameAtom);
  if (path) {
    return imageName ? `${path}/${imageName}` : "";
  }
  return imageName ?? "";
});

export const onImageModalOpenAtom = atom(
  null,
  (_get, set, imageName: string, index: number) => {
    set(selectedImageNameAtom, imageName);
  }
);

export const prefetchImagesAtom = atom((get) => {
  const images = get(currentImagesAtom);
  const index = get(selectedImageIndexAtom);

  if (index === undefined) return [];
  if (images.length === 1) return [];

  const previousIndex = (index - 1 + images.length) % images.length;
  const nextIndex = (index + 1 + images.length) % images.length;
  const previousImage = images[previousIndex]!;
  const nextImage = images[nextIndex]!;

  if (previousImage === nextImage) {
    return [nextImage].filter(fileItem => !fileItem.archive);
  } else {
    return [previousImage, nextImage];
  }
});

export const onShowNextImageAtom = atom(null, (get, set, delta: number) => {
  const images = get(currentImagesAtom);
  const index = get(selectedImageIndexAtom);
  if (index === undefined) return;
  const newIndex = (index + delta + images.length) % images.length;
  const imageName = images[newIndex]?.name ?? "";

  set(selectedImageNameAtom, imageName);
});
