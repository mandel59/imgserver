import { expect, test } from "bun:test";
import {
  finderAssetBasePath,
  finderAssetUrl,
  finderHtml,
  selectFinderBuildOutputs,
} from "./finderAssets.ts";

test("finder asset urls are served from dot-prefixed frontend path", () => {
  expect(finderAssetBasePath).toBe("/.fe");
  expect(finderAssetUrl("index.js")).toBe("/.fe/index.js");
});

test("finder html references dot-prefixed frontend assets", () => {
  const html = finderHtml();
  expect(html).toContain('href="/.fe/index.css"');
  expect(html).toContain('href="/.fe/favicon.jpeg"');
  expect(html).toContain('src="/.fe/index.js"');
});

test("selectFinderBuildOutputs picks in-memory js and css outputs", () => {
  const outputs = [
    { path: "./index.js", type: "text/javascript;charset=utf-8" },
    { path: "./index.css", type: "text/css;charset=utf-8" },
  ] as const;
  const [js, css] = outputs;

  expect(selectFinderBuildOutputs(outputs)).toEqual({
    js,
    css,
  });
});
