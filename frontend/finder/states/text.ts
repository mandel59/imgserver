import { atom } from "jotai";
import { basename } from "path-browserify";
import {
  currentPathAtom,
  selectedImageNameAtom,
  selectedTextNameAtom,
} from "./location.ts";

export const isTextModalOpenAtom = atom(
  (get) => get(selectedTextNameAtom) !== "",
  (_get, set, open: boolean) => {
    if (!open) {
      set(selectedTextNameAtom, "");
    }
  }
);

export const selectedTextPathAtom = atom((get) => {
  const path = get(currentPathAtom);
  const textName = get(selectedTextNameAtom);
  if (path) {
    return textName ? `${path}/${textName}` : "";
  }
  return textName ?? "";
});

export const onTextModalOpenAtom = atom(null, (_get, set, path: string) => {
  set(selectedImageNameAtom, "");
  set(selectedTextNameAtom, basename(path));
});
