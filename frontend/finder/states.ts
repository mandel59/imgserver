import { atom } from "jotai";
import type { FileItem, SortOption } from "./types.ts";

export const currentPath = atom("");
export const currentImageIndex = atom(0);
export const currentImages = atom<FileItem[]>([]);
export const sortOption = atom<SortOption>("name");
