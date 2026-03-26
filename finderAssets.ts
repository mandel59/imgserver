export const finderAssetBasePath = "/.fe";

export interface BuildOutputLike {
  path: string;
  type: string;
}

export interface FinderBuildOutputs<T extends BuildOutputLike> {
  js: T;
  css: T;
}

export function finderAssetUrl(filename: string) {
  return `${finderAssetBasePath}/${filename}`;
}

export function finderHtml() {
  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Image Viewer</title>
    <link rel="stylesheet" href="${finderAssetUrl("index.css")}" />
    <link rel="icon" href="${finderAssetUrl("favicon.jpeg")}" />
    <script type="module" src="${finderAssetUrl("index.js")}"></script>
  </head>
  <body></body>
</html>
`;
}

export function selectFinderBuildOutputs<T extends BuildOutputLike>(
  outputs: T[],
): FinderBuildOutputs<T> {
  const js = outputs.find((output) => output.path.endsWith("/index.js") || output.path === "./index.js");
  const css = outputs.find((output) => output.path.endsWith("/index.css") || output.path === "./index.css");

  if (!js || !css) {
    throw new Error("Missing built finder assets");
  }

  return { js, css };
}
