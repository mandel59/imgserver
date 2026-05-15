import { expect, test } from "bun:test";
import { nextFileFocusIndex } from "./fileNavigation.ts";

test("left and right arrow navigation matches previous and next item", () => {
  expect(
    nextFileFocusIndex({
      key: "ArrowRight",
      currentIndex: 1,
      itemCount: 5,
      columns: 3,
    })
  ).toBe(2);
  expect(
    nextFileFocusIndex({
      key: "ArrowLeft",
      currentIndex: 1,
      itemCount: 5,
      columns: 3,
    })
  ).toBe(0);
});

test("up and down arrow navigation uses the visual column count", () => {
  expect(
    nextFileFocusIndex({
      key: "ArrowDown",
      currentIndex: 1,
      itemCount: 8,
      columns: 3,
    })
  ).toBe(4);
  expect(
    nextFileFocusIndex({
      key: "ArrowUp",
      currentIndex: 4,
      itemCount: 8,
      columns: 3,
    })
  ).toBe(1);
});

test("arrow navigation stops at the first and last item without looping", () => {
  expect(
    nextFileFocusIndex({
      key: "ArrowLeft",
      currentIndex: 0,
      itemCount: 5,
      columns: 3,
    })
  ).toBe(0);
  expect(
    nextFileFocusIndex({
      key: "ArrowUp",
      currentIndex: 2,
      itemCount: 5,
      columns: 3,
    })
  ).toBe(2);
  expect(
    nextFileFocusIndex({
      key: "ArrowRight",
      currentIndex: 4,
      itemCount: 5,
      columns: 3,
    })
  ).toBe(4);
  expect(
    nextFileFocusIndex({
      key: "ArrowDown",
      currentIndex: 2,
      itemCount: 5,
      columns: 3,
    })
  ).toBe(2);
});
