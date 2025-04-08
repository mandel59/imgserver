declare var Hammer: any;
type ImageItem = {
  name: string;
  isDirectory: boolean;
  isImage: boolean;
  modified: number;
  size: number;
  path: string;
};

async function init() {
  let currentPath = "";
  let currentImageIndex = 0;
  let currentImages: ImageItem[] = [];

  const sortOption = document.getElementById(
    "sort-option"
  ) as HTMLSelectElement;

  // アイテム一覧を取得
  async function fetchItems(): Promise<ImageItem[]> {
    const response = await fetch(
      `/api/images?sort=${sortOption.value}&path=${encodeURIComponent(
        currentPath
      )}`
    );
    return await response.json();
  }

  // ソートオプション変更時の処理
  sortOption.addEventListener("change", async () => {
    const items = await fetchItems();
    renderItemList(items);
  });

  // モーダル要素を取得
  const modal = document.getElementById("image-modal") as HTMLDivElement;
  const modalImg = modal.querySelector("img") as HTMLImageElement;
  const closeBtn = modal.querySelector("button") as HTMLButtonElement;

  // スワイプ操作の設定
  const hammer = new Hammer(modal);
  hammer.on("swipeleft", () => {
    if (currentImages.length === 0 || currentImageIndex === -1) return;
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    modalImg.src = `/images/${currentImages[currentImageIndex]!.path}`;
    updateAppState(
      currentPath,
      currentImages[currentImageIndex]!.path.split("/").pop()!
    );
  });
  hammer.on("swiperight", () => {
    if (currentImages.length === 0 || currentImageIndex === -1) return;
    currentImageIndex =
      (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    modalImg.src = `/images/${currentImages[currentImageIndex]!.path}`;
    updateAppState(
      currentPath,
      currentImages[currentImageIndex]!.path.split("/").pop()!
    );
  });

  // 状態更新関数
  async function updateAppState(
    newPath: string,
    imageName: string | null = null
  ) {
    console.log("Updating app state:", { newPath, imageName });

    // 現在表示されている画像インデックスを保存 (遷移前)
    if (currentPath !== null && currentPath !== undefined) {
      const topIndex = getTopVisibleImageIndex();
      scrollPositions[currentPath] = topIndex;
      console.log(`Saved top image index for "${currentPath}": ${topIndex}`);
    }

    const urlParams = new URLSearchParams();
    if (newPath) urlParams.set("path", newPath);
    if (imageName) urlParams.set("image", imageName);

    console.log("New URL params:", urlParams.toString());
    history.pushState({}, "", `?${urlParams.toString()}`);

    const pathChanged = currentPath !== newPath;
    currentPath = newPath;
    console.log("Current path updated to:", currentPath);

    // 新しいパスのスクロール位置を初期化
    if (!scrollPositions[currentPath]) {
      scrollPositions[currentPath] = 0;
      console.log(`Initialized scroll position for "${currentPath}" to 0`);
    }

    if (pathChanged) {
      const items = await fetchItems();
      console.log("Fetched items:", items);
      await renderItemList(items);

      // スクロール位置を復元
      const savedIndex = scrollPositions[currentPath] || 0;
      console.log(
        `Restoring scroll position for "${currentPath}": index ${savedIndex}`
      );
      scrollToImageIndex(savedIndex);
    }
  }

  // モーダルを閉じる
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    hideModal();
    // URLを更新 (画像パラメータを削除)
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete("image");
    history.pushState({}, "", `?${urlParams.toString()}`);
  });

  // バックドロップクリックでモーダルを閉じる
  const backdrop = modal.querySelector("div")!;
  backdrop.addEventListener("click", () => {
    modal.style.display = "none";
    hideModal();
    // URLを更新 (画像パラメータを削除)
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete("image");
    history.pushState({}, "", `?${urlParams.toString()}`);
  });

  // モーダル表示時にスクロールを無効化
  function showModal() {
    modal.style.display = "flex";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  // モーダル非表示時にスクロールを有効化
  function hideModal() {
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
  }

  // キーボード操作
  document.addEventListener("keydown", (e) => {
    if (modal.style.display === "flex") {
      if (e.key === "Escape") {
        modal.style.display = "none";
        hideModal();
        // URLを更新 (画像パラメータを削除)
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete("image");
        history.pushState({}, "", `?${urlParams.toString()}`);
      } else if (
        (e.key === "ArrowRight" || e.key === "ArrowLeft") &&
        currentImageIndex !== -1
      ) {
        // モディファイアキーが押されている場合は無視
        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
          return;
        }
        // 右/左矢印キーで画像切り替え
        currentImageIndex =
          (currentImageIndex +
            (e.key === "ArrowRight" ? 1 : -1) +
            currentImages.length) %
          currentImages.length;
        modalImg.src = `/images/${currentImages[currentImageIndex]!.path}`;
        updateAppState(
          currentPath,
          currentImages[currentImageIndex]!.path.split("/").pop()
        );
      }
    }
  });

  // スクロール位置を保存 (画像インデックス方式)
  const scrollPositions: Record<string, number> = Object.create(null);

  // 表示されている一番上の画像インデックスを取得 (スクロール範囲に表示されているもの)
  function getTopVisibleImageIndex(): number {
    const container = document.getElementById(
      "image-container"
    ) as HTMLDivElement;
    const items = container.children;
    const containerTop = container.getBoundingClientRect().top;
    const viewportHeight = window.innerHeight;

    // 表示範囲の閾値 (ビューポートの上から20%～80%を表示範囲とみなす)
    const visibleTopThreshold = viewportHeight * 0.2;
    const visibleBottomThreshold = viewportHeight * 0.8;

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement;
      const itemRect = item.getBoundingClientRect();

      // アイテムの上端と下端が表示範囲内にあるかチェック
      const isTopVisible =
        itemRect.top >= visibleTopThreshold &&
        itemRect.top <= visibleBottomThreshold;
      const isBottomVisible =
        itemRect.bottom >= visibleTopThreshold &&
        itemRect.bottom <= visibleBottomThreshold;

      // アイテムの一部でも表示範囲内にあればそのインデックスを返す
      if (
        isTopVisible ||
        isBottomVisible ||
        (itemRect.top <= visibleTopThreshold &&
          itemRect.bottom >= visibleBottomThreshold)
      ) {
        return i;
      }
    }

    // 表示範囲内にない場合はスクロール位置に最も近いアイテムを返す
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < items.length; i++) {
      const itemRect = (items[i] as HTMLElement).getBoundingClientRect();
      const distance = Math.abs(itemRect.top - visibleTopThreshold);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  // 画像インデックスからスクロール位置を計算
  function scrollToImageIndex(index: number) {
    const container = document.getElementById(
      "image-container"
    ) as HTMLDivElement;
    if (index <= 0 || !container.children[index]) {
      window.scrollTo(0, 0);
      return;
    }

    const item = container.children[index];
    const itemRect = item.getBoundingClientRect();
    const absoluteItemTop = itemRect.top + window.scrollY;

    // ビューポートの表示範囲閾値（上側）に合わせてスクロール位置を調整
    const visibleTopThreshold = window.innerHeight * 0.2;
    const scrollPosition = absoluteItemTop - visibleTopThreshold;

    window.scrollTo({
      top: scrollPosition,
      behavior: "auto",
    });
  }

  // URLから状態を復元
  async function restoreFromURL() {
    console.log("Restoring from URL...");
    const params = new URLSearchParams(window.location.search);
    const imageName = params.get("image");
    const pathParam = params.get("path");

    console.log("Current URL params:", { imageName, pathParam });

    // 現在表示されている一番上の画像インデックスを保存
    if (currentPath !== null && currentPath !== undefined) {
      const topIndex = getTopVisibleImageIndex();
      scrollPositions[currentPath] = topIndex;
      console.log(`Saved top image index for "${currentPath}": ${topIndex}`);
    }

    // パスを更新
    currentPath = pathParam ? decodeURIComponent(pathParam) : "";
    console.log("Restoring path:", currentPath);

    // 新しいフォルダに遷移した場合はスクロール位置を初期化
    if (!scrollPositions[currentPath]) {
      scrollPositions[currentPath] = 0;
      console.log(`Initialized scroll position for "${currentPath}" to 0`);
    }

    // 画像表示処理 (先に実行)
    if (imageName) {
      const fullPath = currentPath ? `${currentPath}/${imageName}` : imageName;
      console.log("Loading image first:", fullPath);
      currentImageIndex = -1; // 無効値に設定
      modalImg.src = `/images/${fullPath}`;
      showModal();
    }

    // アイテムを取得
    const items = await fetchItems();
    console.log("Fetched items:", items);

    // currentImageIndexが無効値の場合のみインデックス検索
    if (imageName && currentImageIndex === -1) {
      const fullPath = currentPath ? `${currentPath}/${imageName}` : imageName;
      console.log("Searching for image:", fullPath);

      const index = items.findIndex(
        (i) => !i.isDirectory && i.path === fullPath
      );
      if (index !== -1) {
        console.log("Found image at index:", index);
        currentImageIndex = index;
      } else {
        console.log("Image not found");
      }
    }

    await renderItemList(items);

    // スクロール位置を復元
    const savedIndex = scrollPositions[currentPath] || 0;
    console.log(
      `Restoring scroll position for "${currentPath}": index ${savedIndex}`
    );
    scrollToImageIndex(savedIndex);
  }

  // アイテム一覧を表示 (async版)
  async function renderItemList(items: ImageItem[]) {
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
      parts.forEach((part, i) => {
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
    currentImages = items.filter((item) => item.isImage);

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
          console.log("Key pressed on folder:", e.key);
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
          currentImageIndex = index;
          modalImg.src = `/images/${item.path}`;
          showModal();
          const fileName = item.path.split("/").pop();
          console.log("Opening image:", { path: item.path, fileName });
          updateAppState(currentPath, fileName);
        };

        // クリックで開く
        imgWrapper.addEventListener("click", openImage);

        // キーボードで開く
        imgWrapper.addEventListener("keydown", (e) => {
          console.log("Key pressed:", e.key);
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

  // 戻る/進む操作に対応 (新しい仕様に合わせて)
  window.addEventListener("popstate", async () => {
    // モーダルを閉じてから状態復元
    modal.style.display = "none";
    await restoreFromURL();
  });

  await restoreFromURL();
}

// ページ読み込み時に状態復元
window.addEventListener("DOMContentLoaded", init);
