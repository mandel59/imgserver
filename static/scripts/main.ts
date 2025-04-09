import type { ImageItem } from './types';
import { fetchItems } from './api';
import { renderItemList } from './render/itemList';
import { setupModal } from './render/modal';

async function init() {
  // モーダル初期化
  const { showModal, hideModal, modalImg, modal, closeBtn, backdrop } = setupModal();

  let currentPath = "";
  let currentImageIndex = 0;
  let currentImages: ImageItem[] = [];

  const sortOption = document.getElementById(
    "sort-option"
  ) as HTMLSelectElement;

  // ソートオプション変更時の処理
  sortOption.addEventListener("change", async () => {
    const items = await fetchItems(sortOption.value, currentPath);
    await renderItemList({
      items,
      currentPath,
      currentImages,
      updateAppState,
      showModal,
      modalImg
    });
  });

  // スワイプ操作の設定
  const hammer = new Hammer(modal);
  hammer.on("swipeleft", () => {
    if (currentImages.length === 0 || currentImageIndex === -1) {
      console.warn('No images available to swipe');
      return;
    }
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    const currentImage = currentImages[currentImageIndex];
    if (!currentImage?.path) {
      console.error('Invalid image data:', currentImage);
      return;
    }
    modalImg.src = `/images/${currentImage.path}`;
    updateAppState(
      currentPath,
      currentImage.path.split("/").pop()!
    );
  });
  hammer.on("swiperight", () => {
    if (currentImages.length === 0 || currentImageIndex === -1) {
      console.warn('No images available to swipe');
      return;
    }
    currentImageIndex =
      (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    const currentImage = currentImages[currentImageIndex];
    if (!currentImage?.path) {
      console.error('Invalid image data:', currentImage);
      return;
    }
    modalImg.src = `/images/${currentImage.path}`;
    updateAppState(
      currentPath,
      currentImage.path.split("/").pop()!
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
      const items = await fetchItems(sortOption.value, currentPath);
      console.log("Fetched items:", items);
      await renderItemList({
        items,
        currentPath,
        currentImages,
        updateAppState,
        showModal,
        modalImg
      });

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
  backdrop.addEventListener("click", () => {
    modal.style.display = "none";
    hideModal();
    // URLを更新 (画像パラメータを削除)
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete("image");
    history.pushState({}, "", `?${urlParams.toString()}`);
  });

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
        const currentImage = currentImages[currentImageIndex];
        if (!currentImage?.path) {
          console.error('Invalid image data:', currentImage);
          return;
        }
        modalImg.src = `/images/${currentImage.path}`;
        updateAppState(
          currentPath,
          currentImage.path.split("/").pop()
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
    const items = await fetchItems(sortOption.value, currentPath);
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

    await renderItemList({
      items,
      currentPath,
      currentImages,
      updateAppState,
      showModal,
      modalImg
    });

    // スクロール位置を復元
    const savedIndex = scrollPositions[currentPath] || 0;
    console.log(
      `Restoring scroll position for "${currentPath}": index ${savedIndex}`
    );
    scrollToImageIndex(savedIndex);
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
