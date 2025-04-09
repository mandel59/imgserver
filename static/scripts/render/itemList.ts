import type { AppState, AppDependencies, ImageItem } from '../types';

interface RenderItemListParams {
  items: ImageItem[];
  state: AppState;
  deps: AppDependencies;
  updateAppState: (
    newPath: string, 
    imageName?: string | null,
    state?: AppState,
    deps?: AppDependencies
  ) => Promise<void>;
}

export async function renderItemList({
  items,
  state,
  deps,
  updateAppState
}: RenderItemListParams) {
  const { currentPath, currentImages } = state;
  const { showModal, modalImg } = deps;
  const container = document.getElementById(
    "image-container"
  ) as HTMLDivElement;
  container.innerHTML = "";

  // パンくずリストを表示
  const breadcrumbsContainer = document.getElementById(
    "breadcrumbs-container"
  ) as HTMLDivElement;
  breadcrumbsContainer.innerHTML = "";

  const breadcrumbs = document.createElement("div");
  breadcrumbs.style.marginBottom = "10px";

  const rootLink = document.createElement("a");
  rootLink.textContent = "Home";
  rootLink.href = `?path=`;
  rootLink.style.marginRight = "5px";
  rootLink.tabIndex = 0;

  // 共通のフォルダ開処理
  const navigateToRoot = (e: Event) => {
    e.preventDefault();
    updateAppState("");
  };

  // クリックで開く
  rootLink.addEventListener("click", navigateToRoot);

  // キーボードで開く
  rootLink.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      navigateToRoot(e);
    }
  });
  breadcrumbs.appendChild(rootLink);

  if (currentPath) {
    const parts = currentPath.split("/");
    parts.forEach((part: string, i: number) => {
      const currentPartPath = parts.slice(0, i + 1).join("/");
      const span = document.createElement("span");
      span.textContent = " > ";
      breadcrumbs.appendChild(span);

      const link = document.createElement("a");
      link.textContent = part;
      link.href = `?path=${encodeURIComponent(currentPartPath)}`;
      link.style.marginRight = "5px";
      link.tabIndex = 0;

      // 共通のフォルダ開処理
      const navigateToPath = (e: Event) => {
        e.preventDefault();
        updateAppState(currentPartPath);
      };

      // クリックで開く
      link.addEventListener("click", navigateToPath);

      // キーボードで開く
      link.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigateToPath(e);
        }
      });
      breadcrumbs.appendChild(link);
    });
  }

  breadcrumbsContainer.appendChild(breadcrumbs);

  // アイテムを表示
  state.currentImages = items.filter((item) => item.isImage);

  items.forEach((item) => {
    const itemElement = document.createElement("div");
    itemElement.style.width = "200px";
    itemElement.style.height = "222px"; // ファイル名表示領域を含めた高さ
    itemElement.style.display = "flex";
    itemElement.style.flexDirection = "column";
    itemElement.style.alignItems = "center";
    itemElement.style.cursor = "pointer";
    itemElement.style.marginBottom = "10px";

    if (item.isDirectory) {
      // ディレクトリ表示
      const folderWrapper = document.createElement("div");
      folderWrapper.tabIndex = 0;
      folderWrapper.style.width = "180px";
      folderWrapper.style.height = "180px";
      folderWrapper.style.display = "flex";
      folderWrapper.style.flexDirection = "column";
      folderWrapper.style.alignItems = "center";
      folderWrapper.style.justifyContent = "center";
      folderWrapper.style.margin = "0 auto";

      const folderIcon = document.createElement("div");
      folderIcon.style.fontSize = "60px";
      folderIcon.textContent = "📁";

      const folderName = document.createElement("div");
      folderName.textContent = item.name;

      // 共通のフォルダ開処理
      const openFolder = () => {
        updateAppState(item.path);
      };

      // クリックで開く
      folderWrapper.addEventListener("click", openFolder);

      // キーボードで開く
      folderWrapper.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openFolder();
        }
      });

      folderWrapper.appendChild(folderIcon);
      folderWrapper.appendChild(folderName);
      itemElement.appendChild(folderWrapper);
    } else if (item.isImage) {
      // 画像表示
      // 画像をラップするdivを作成
      const imgWrapper = document.createElement("div");
      imgWrapper.tabIndex = 0;
      imgWrapper.style.width = "180px";
      imgWrapper.style.height = "180px";
      imgWrapper.style.position = "relative";
      imgWrapper.style.margin = "0 auto";
      imgWrapper.style.overflow = "hidden";

      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = `/images/${item.path}`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";

      // 共通の画像開処理
      const openImage = () => {
        const index = currentImages.findIndex((i) => i.path === item.path);
        modalImg.src = `/images/${item.path}`;
        showModal();
        const fileName = item.path.split("/").pop();
        updateAppState(currentPath, fileName);
      };

      // クリックで開く
      imgWrapper.addEventListener("click", openImage);

      // キーボードで開く
      imgWrapper.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openImage();
        }
      });

      imgWrapper.appendChild(img);
      // ファイル名表示用のdivを作成
      const fileNameDiv = document.createElement("div");
      fileNameDiv.textContent = item.name;
      fileNameDiv.style.width = "180px";
      fileNameDiv.style.height = "42px";
      fileNameDiv.style.wordWrap = "break-word";
      fileNameDiv.style.textAlign = "center";
      fileNameDiv.style.padding = "5px";
      fileNameDiv.style.boxSizing = "border-box";
      fileNameDiv.style.overflow = "hidden";
      fileNameDiv.style.textOverflow = "ellipsis";
      fileNameDiv.style.display = "-webkit-box";
      fileNameDiv.style.webkitLineClamp = "2";
      fileNameDiv.style.webkitBoxOrient = "vertical";

      itemElement.appendChild(imgWrapper);
      itemElement.appendChild(fileNameDiv);
    } else {
      // 通常ファイル表示
      const fileWrapper = document.createElement("div");
      fileWrapper.tabIndex = 0;
      fileWrapper.style.width = "180px";
      fileWrapper.style.height = "180px";
      fileWrapper.style.display = "flex";
      fileWrapper.style.flexDirection = "column";
      fileWrapper.style.alignItems = "center";
      fileWrapper.style.justifyContent = "center";
      fileWrapper.style.margin = "0 auto";

      const fileIcon = document.createElement("div");
      fileIcon.style.fontSize = "60px";
      fileIcon.textContent = "📄";

      const fileNameDiv = document.createElement("div");
      fileNameDiv.textContent = item.name;
      fileNameDiv.style.width = "180px";
      fileNameDiv.style.height = "42px";
      fileNameDiv.style.wordWrap = "break-word";
      fileNameDiv.style.textAlign = "center";
      fileNameDiv.style.padding = "5px";
      fileNameDiv.style.boxSizing = "border-box";
      fileNameDiv.style.overflow = "hidden";
      fileNameDiv.style.textOverflow = "ellipsis";
      fileNameDiv.style.display = "-webkit-box";
      fileNameDiv.style.webkitLineClamp = "2";
      fileNameDiv.style.webkitBoxOrient = "vertical";

      fileWrapper.appendChild(fileIcon);
      itemElement.appendChild(fileWrapper);
      itemElement.appendChild(fileNameDiv);
    }

    container.appendChild(itemElement);
  });
}
