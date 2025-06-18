import { atom } from "jotai";
import type { FileItem } from "@/common/types.ts";
import { currentPathAtom, selectedImageNameAtom } from "./location.ts";
import { currentFileItemsQueryAtom } from "./fileList.ts";

export const isImageModalOpenAtom = atom(
  (get) => get(selectedImageNameAtom) !== "",
  (_get, set, open: boolean) => {
    if (!open) {
      set(selectedImageNameAtom, "");
    }
  }
);

export const currentImagesAtom = atom<FileItem[]>(
  (get) =>
    get(currentFileItemsQueryAtom).data?.files?.filter?.(
      (file) => file.isImage
    ) ?? []
);

export const selectedImageIndexAtom = atom<number | null>(null);

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
    set(selectedImageIndexAtom, index);
  }
);

export const onShowNextImageAtom = atom(null, (get, set, delta: number) => {
  const images = get(currentImagesAtom);
  const imagePath = get(selectedImagePathAtom);
  const index =
    get(selectedImageIndexAtom) ??
    images.findIndex((file) => file.path === imagePath);

  if (images.length === 0 || index === -1) return;
  const newIndex = (index + delta + images.length) % images.length;
  const imageName = images[newIndex]?.name ?? "";

  set(selectedImageNameAtom, imageName);
  set(selectedImageIndexAtom, newIndex);
});
