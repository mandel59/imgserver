import { atom } from "jotai";
import { focusAtom } from "jotai-optics";
import { atomWithLocation } from "jotai-location";
import { resolve, dirname, basename } from "path-browserify";

interface LocationState {
  path: string;
  image: string;
  archive: string;
}

function locationStateEquivalent(a: LocationState, b: LocationState) {
  return a.path === b.path && a.archive === b.archive;
}

export function updateLocation(location: LocationState): URL {
  const url = new URL(window.location.href);
  url.pathname = resolve("/", location.path);
  url.search = "";
  if (location.image) url.searchParams.set("image", location.image);
  if (location.archive) url.searchParams.set("archive", location.archive);
  return url;
}

export function locationOfDir(path: string, archive: string): LocationState {
  return {
    path,
    image: "",
    archive,
  }
}

export function locationOfImage(path: string, archive: string): LocationState {
  return {
    path: dirname(path),
    image: basename(path),
    archive,
  }
}

function getLocation(): LocationState {
  const u = new URL(window.location.href);
  const searchParams = u.searchParams;
  return {
    path: decodeURI(u.pathname).slice(1),
    image: searchParams?.get("image") ?? "",
    archive: searchParams?.get("archive") ?? "",
  };
}

function applyLocation(location: LocationState) {
  const currentLocation = getLocation();
  const replace = locationStateEquivalent(currentLocation, location);
  const url = updateLocation(location);
  if (replace) {
    window.history.replaceState(window.history.state, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
}

const locationAtom = atomWithLocation({ getLocation, applyLocation });

export const currentPathAtom = focusAtom(locationAtom, optic => optic.prop("path"));
export const currentArchiveAtom = focusAtom(locationAtom, optic => optic.prop("archive"));
export const selectedImageNameAtom = focusAtom(locationAtom, optic => optic.prop("image"));
export const onNavigateAtom = atom(null, (_get, set, location: LocationState) => {
  set(locationAtom, location);
});
