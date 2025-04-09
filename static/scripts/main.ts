import type { ImageItem, AppState, AppDependencies } from './types';
import { fetchItems } from './api';
import { renderItemList } from './render/itemList';
import { setupModal } from './render/modal';
import { setupKeyboardHandlers } from './events/keyboard';
import { setupHammerHandlers } from './events/hammer';

async function init() {
  // モーダル初期化
  const { showModal, hideModal, modalImg, modal, closeBtn, backdrop } = setupModal();

  const state = {
    currentPath: "",
    currentImageIndex: 0,
    currentImages: [] as ImageItem[],
    scrollPositions: Object.create(null) as Record<string, number>
  };

  const sortOption = document.getElementById(
    "sort-option"
  ) as HTMLSelectElement;

  const deps = {
    sortOption,
    showModal,
    hideModal,
    modalImg
  };

  // ソートオプション変更時の処理
  sortOption.addEventListener("change", async () => {
    const items = await fetchItems(deps.sortOption.value, state.currentPath);
    await renderItemList({
      items,
      state,
      deps,
      updateAppState
    });
  });

  // スワイプ操作の設定
  const hammer = setupHammerHandlers(modal, state, deps, updateAppState);

  // 状態更新関数
  async function updateAppState(
    newPath: string,
    imageName: string | null = null,
    newState?: AppState,
    newDeps?: AppDependencies
  ) {
    const currentState = newState || state;
    const currentDeps = newDeps || deps;
    
    console.log("Updating app state:", { newPath, imageName });

    // 現在表示されている画像インデックスを保存 (遷移前)
    if (currentState.currentPath !== null && currentState.currentPath !== undefined) {
      const topIndex = getTopVisibleImageIndex();
      currentState.scrollPositions[currentState.currentPath] = topIndex;
      console.log(`Saved top image index for "${currentState.currentPath}": ${topIndex}`);
    }

    const urlParams = new URLSearchParams();
    if (newPath) urlParams.set("path", newPath);
    if (imageName) urlParams.set("image", imageName);

    console.log("New URL params:", urlParams.toString());
    history.pushState({}, "", `?${urlParams.toString()}`);

    const pathChanged = currentState.currentPath !== newPath;
    currentState.currentPath = newPath;
    console.log("Current path updated to:", currentState.currentPath);

    // 新しいパスのスクロール位置を初期化
    if (!currentState.scrollPositions[currentState.currentPath]) {
      currentState.scrollPositions[currentState.currentPath] = 0;
      console.log(`Initialized scroll position for "${currentState.currentPath}" to 0`);
    }

    if (pathChanged) {
      const items = await fetchItems(currentDeps.sortOption.value, currentState.currentPath);
      console.log("Fetched items:", items);
      await renderItemList({
        items,
        state: currentState,
        deps: currentDeps,
        updateAppState
      });

      // スクロール位置を復元
      const savedIndex = currentState.scrollPositions[currentState.currentPath] || 0;
      console.log(
        `Restoring scroll position for "${currentState.currentPath}": index ${savedIndex}`
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

  // キーボード操作の設定
  setupKeyboardHandlers(modal, state, deps, updateAppState);

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
    if (state.currentPath !== null && state.currentPath !== undefined) {
      const topIndex = getTopVisibleImageIndex();
      state.scrollPositions[state.currentPath] = topIndex;
      console.log(`Saved top image index for "${state.currentPath}": ${topIndex}`);
    }

    // パスを更新
    state.currentPath = pathParam ? decodeURIComponent(pathParam) : "";
    console.log("Restoring path:", state.currentPath);

    // 新しいフォルダに遷移した場合はスクロール位置を初期化
    if (!state.scrollPositions[state.currentPath]) {
      state.scrollPositions[state.currentPath] = 0;
      console.log(`Initialized scroll position for "${state.currentPath}" to 0`);
    }

    // 画像表示処理 (先に実行)
    if (imageName) {
      const fullPath = state.currentPath ? `${state.currentPath}/${imageName}` : imageName;
      console.log("Loading image first:", fullPath);
      state.currentImageIndex = -1; // 無効値に設定
      modalImg.src = `/images/${fullPath}`;
      showModal();
    }

    // アイテムを取得
    const items = await fetchItems(deps.sortOption.value, state.currentPath);
    console.log("Fetched items:", items);

    // currentImageIndexが無効値の場合のみインデックス検索
    if (imageName && state.currentImageIndex === -1) {
      const fullPath = state.currentPath ? `${state.currentPath}/${imageName}` : imageName;
      console.log("Searching for image:", fullPath);

      const index = items.findIndex(
        (i) => !i.isDirectory && i.path === fullPath
      );
      if (index !== -1) {
        console.log("Found image at index:", index);
        state.currentImageIndex = index;
      } else {
        console.log("Image not found");
      }
    }

    await renderItemList({
      items,
      state,
      deps,
      updateAppState
    });

    // スクロール位置を復元
    const savedIndex = state.scrollPositions[state.currentPath] || 0;
    console.log(
      `Restoring scroll position for "${state.currentPath}": index ${savedIndex}`
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
