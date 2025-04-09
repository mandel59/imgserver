import type { AppState, AppDependencies } from '../types';
import Hammer from 'hammerjs';

export function setupHammerHandlers(
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
  const hammer = new Hammer(modal);
  
  hammer.on("swipeleft", () => {
    if (state.currentImages.length === 0 || state.currentImageIndex === -1) {
      console.warn('No images available to swipe');
      return;
    }
    state.currentImageIndex = (state.currentImageIndex + 1) % state.currentImages.length;
    const currentImage = state.currentImages[state.currentImageIndex];
    if (!currentImage?.path) {
      console.error('Invalid image data:', currentImage);
      return;
    }
    deps.modalImg.src = `/images/${currentImage.path}`;
    updateAppState(
      state.currentPath,
      currentImage.path.split("/").pop()!,
      state,
      deps
    );
  });

  hammer.on("swiperight", () => {
    if (state.currentImages.length === 0 || state.currentImageIndex === -1) {
      console.warn('No images available to swipe');
      return;
    }
    state.currentImageIndex =
      (state.currentImageIndex - 1 + state.currentImages.length) % state.currentImages.length;
    const currentImage = state.currentImages[state.currentImageIndex];
    if (!currentImage?.path) {
      console.error('Invalid image data:', currentImage);
      return;
    }
    deps.modalImg.src = `/images/${currentImage.path}`;
    updateAppState(
      state.currentPath,
      currentImage.path.split("/").pop()!,
      state,
      deps
    );
  });

  return hammer;
}
