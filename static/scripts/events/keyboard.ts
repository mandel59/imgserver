import type { AppState, AppDependencies } from '../types';

export function setupKeyboardHandlers(
  modal: HTMLElement,
  state: AppState,
  deps: AppDependencies,
  updateAppState: (
    newPath: string,
    imageName: string | null,
    state: AppState,
    deps: AppDependencies
  ) => Promise<void>
) {
  document.addEventListener("keydown", (e) => {
    if (modal.style.display === "flex") {
      if (e.key === "Escape") {
        modal.style.display = "none";
        deps.hideModal();
        // URLを更新 (画像パラメータを削除)
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete("image");
        history.pushState({}, "", `?${urlParams.toString()}`);
      } else if (
        (e.key === "ArrowRight" || e.key === "ArrowLeft") &&
        state.currentImageIndex !== -1
      ) {
        // モディファイアキーが押されている場合は無視
        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
          return;
        }
        // 右/左矢印キーで画像切り替え
        state.currentImageIndex =
          (state.currentImageIndex +
            (e.key === "ArrowRight" ? 1 : -1) +
            state.currentImages.length) %
          state.currentImages.length;
        const currentImage = state.currentImages[state.currentImageIndex];
        if (!currentImage?.path) {
          console.error('Invalid image data:', currentImage);
          return;
        }
        deps.modalImg.src = `/images/${currentImage.path}`;
        updateAppState(
          state.currentPath,
          currentImage.path.split("/").pop() ?? null,
          state,
          deps
        );
      }
    }
  });
}
