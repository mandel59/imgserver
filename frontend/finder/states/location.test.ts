import { expect, test } from "bun:test";
import { navigationForParentDir } from "../locationNavigation.ts";

test("navigationForParentDir returns null at the root directory", () => {
  expect(navigationForParentDir({ path: "", archive: "" })).toBeNull();
});

test("navigationForParentDir navigates to the parent filesystem directory", () => {
  expect(navigationForParentDir({ path: "foo/bar", archive: "" })).toEqual({
    path: "foo",
    image: "",
    text: "",
    archive: "",
    glob: "",
  });
});

test("navigationForParentDir keeps archive context inside an archive", () => {
  expect(
    navigationForParentDir({
      path: "photos.zip/dir/subdir",
      archive: "photos.zip",
    })
  ).toEqual({
    path: "photos.zip/dir",
    image: "",
    text: "",
    archive: "photos.zip",
    glob: "",
  });
});

test("navigationForParentDir leaves archive context from the archive root", () => {
  expect(
    navigationForParentDir({
      path: "archives/photos.zip",
      archive: "archives/photos.zip",
    })
  ).toEqual({
    path: "archives",
    image: "",
    text: "",
    archive: "",
    glob: "",
  });
});
