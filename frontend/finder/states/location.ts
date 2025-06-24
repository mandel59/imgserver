import { atom } from "jotai";
import { focusAtom } from "jotai-optics";
import { atomWithLocation } from "jotai-location";
import { resolve, dirname, basename } from "path-browserify";

export interface LocationState {
  path: string;
  image: string;
  archive: string;
  glob: string;
}

export type Navigation = Partial<LocationState>;

function locationStateEquivalent(a: LocationState, b: LocationState) {
  return a.path === b.path && a.archive === b.archive;
}

export function urlOfLocation(location: LocationState): URL {
  const url = new URL(window.location.href);
  url.pathname = resolve("/", location.path);
  url.search = "";
  if (location.image) url.searchParams.set("image", location.image);
  if (location.archive) url.searchParams.set("archive", location.archive);
  if (location.glob) url.searchParams.set("glob", location.glob);
  return url;
}

export function locationOfUrl(url: URL): LocationState {
  const searchParams = url.searchParams;
  return {
    path: decodeURI(url.pathname).slice(1) || searchParams?.get("path") || "",
    image: searchParams?.get("image") ?? "",
    archive: searchParams?.get("archive") ?? "",
    glob: searchParams?.get("glob") ?? "",
  };
}

export function navigated(location: LocationState, navigation: Navigation): LocationState {
  return { ...location, ...navigation };
}

export function navigationForDir(path: string, archive: string): Navigation {
  return {
    path,
    image: "",
    archive,
    glob: "",
  }
}

export function navigationForImage(path: string, archive: string): Navigation {
  return {
    path: dirname(path),
    image: basename(path),
    archive,
  }
}

function getLocation(): LocationState {
  const u = new URL(window.location.href);
  return locationOfUrl(u);
}

function applyLocation(location: LocationState) {
  const currentLocation = getLocation();
  const replace = locationStateEquivalent(currentLocation, location);
  const url = urlOfLocation(location);
  if (replace) {
    window.history.replaceState(window.history.state, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
}

function getAndCanonicalizeLocation() {
  const locationHref = window.location.href;
  const locationState = locationOfUrl(new URL(locationHref));
  const u = urlOfLocation(locationState);
  if (u.href !== locationHref) {
    applyLocation(locationState);
  }
  return locationState;
}

export const locationAtom = atomWithLocation({ getLocation: getAndCanonicalizeLocation, applyLocation });

export const currentPathAtom = focusAtom(locationAtom, optic => optic.prop("path"));
export const currentArchiveAtom = focusAtom(locationAtom, optic => optic.prop("archive"));
export const selectedImageNameAtom = focusAtom(locationAtom, optic => optic.prop("image"));
export const globAtom = focusAtom(locationAtom, optic => optic.prop("glob"));
