import type { AppState, AppDependencies } from '../types';
import { fetchItems } from '../api';
import { renderItemList } from '../render/itemList';

export async function updateAppState(
  newPath: string,
  imageName: string | null = null,
  state: AppState,
  deps: AppDependencies
) {
  const { currentPath, currentImages, scrollPositions } = state;
  const { sortOption, showModal, modalImg } = deps;
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

  const pathChanged = state.currentPath !== newPath;
  state.currentPath = newPath;
  console.log("Current path updated to:", state.currentPath);

  // 新しいパスのスクロール位置を初期化
  if (!state.scrollPositions[state.currentPath]) {
    state.scrollPositions[state.currentPath] = 0;
    console.log(`Initialized scroll position for "${state.currentPath}" to 0`);
  }

  if (pathChanged) {
    const items = await fetchItems(sortOption.value, state.currentPath);
    console.log("Fetched items:", items);
    await renderItemList({
      items,
      state,
      deps,
      updateAppState
    });

    // スクロール位置を復元
    const savedIndex = scrollPositions[currentPath] || 0;
    console.log(
      `Restoring scroll position for "${currentPath}": index ${savedIndex}`
    );
    scrollToImageIndex(savedIndex);
  }
}

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
