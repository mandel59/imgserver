import { useAtom, useAtomValue, useStore } from "jotai";
import React, { useEffect, useCallback, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import "./ImageModal.css";

import {
  isImageModalOpenAtom,
  currentImagesAtom,
  onShowNextImageAtom,
  selectedImageIndexAtom,
  selectedImagePathAtom,
  prefetchImagesAtom,
} from "./states/image.ts";
import { currentArchiveAtom } from "./states/location.ts";
import { imageResourceUrl, imageResourceUrlForFileItem } from "./resources.ts";

export function CloseButton({ closeModal }: { closeModal: () => void }) {
  return (
    <button
      className="close-button"
      aria-label="Close modal"
      onClick={closeModal}
    >
      <FaTimes size={24} />
    </button>
  );
}

export function ImageWithIndicator(
  props: React.ImgHTMLAttributes<HTMLImageElement>
) {
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
        </div>
      )}
      <img {...props} onLoad={handleImageLoad} onError={handleImageError} />
    </>
  );
}

export function ImageContainer() {
  const [selectedImagePath] = useAtom(selectedImagePathAtom);
  const archive = useAtomValue(currentArchiveAtom);
  const prefetchImages = useAtomValue(prefetchImagesAtom);
  const [prevSrc, setPrevSrc] = useState<string | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!selectedImagePath) {
      setCurrentSrc(null);
      return;
    }

    const newSrc = imageResourceUrl(selectedImagePath, { archive });
    if (newSrc !== currentSrc) {
      setPrevSrc(currentSrc);
      setCurrentSrc(newSrc);
      setIsTransitioning(true);
    }
  }, [selectedImagePath, archive]);

  useEffect(() => {
    if (!isTransitioning) return;

    const timer = setTimeout(() => {
      setPrevSrc(null);
      setIsTransitioning(false);
    }, 120); // CSSのトランジション時間と合わせる

    return () => clearTimeout(timer);
  }, [isTransitioning]);

  if (!currentSrc) {
    return null;
  }

  return (
    <div>
      {prevSrc && (
        <div key={prevSrc} className="image-container fade-out">
          <ImageWithIndicator src={prevSrc} />
        </div>
      )}
      <div
        key={currentSrc}
        className={prevSrc ? "image-container fade-in" : "image-container"}
      >
        <ImageWithIndicator src={currentSrc} />
        {prefetchImages.map((fileItem) => {
          return (
            <link
              key={fileItem.name}
              rel="prefetch"
              href={imageResourceUrlForFileItem(fileItem)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function ImageModal() {
  const store = useStore();
  const [isImageModalOpen, setIsModalOpen] = useAtom(isImageModalOpenAtom);
  const [, onShowNextImage] = useAtom(onShowNextImageAtom);
  const images = useAtomValue(currentImagesAtom);
  const selectedImageIndex = useAtomValue(selectedImageIndexAtom);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // react-swipeableでスワイプ操作を設定
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onShowNextImage(1),
    onSwipedRight: () => onShowNextImage(-1),
    trackMouse: false,
  });

  // useSwipeableのrefとdialogRefをマージ
  const mergedRef = useCallback((node: HTMLDialogElement | null) => {
    // dialogRefを設定
    dialogRef.current = node;
    // swipeHandlers.refがあれば適用
    if (node && swipeHandlers.ref) {
      swipeHandlers.ref(node);
    }
  }, []);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
  }, [dialogRef]);

  // モーダルの開閉制御
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      const path = store.get(selectedImagePathAtom);
      const images = store.get(currentImagesAtom);
      const image = images.find((image) => image.path === path);
      if (image) {
        requestAnimationFrame(() => {
          const el = document.querySelector<HTMLElement>(
            `[data-file-name="${image.name}"]`
          );
          el?.focus();
        });
      }
      store.set(isImageModalOpenAtom, false);
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleClose);

    if (isImageModalOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      document.body.style.overflow = "hidden";
    } else {
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = "";
    }

    // 左右キー操作
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        // モディファイアキーが押されている場合は無視
        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
          return;
        }
        onShowNextImage(e.key === "ArrowRight" ? 1 : -1);
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleClose);
      dialog.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [
    isImageModalOpen,
    onShowNextImage,
    selectedImagePathAtom,
    currentImagesAtom,
    isImageModalOpenAtom,
    store,
  ]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      const dialog = dialogRef.current;
      if (e.target === dialog) {
        dialog.close();
      }
    },
    [dialogRef]
  );

  const showSwitchButtons =
    isImageModalOpen && selectedImageIndex !== undefined && images.length > 1;

  return (
    <dialog
      aria-label="Image"
      ref={mergedRef}
      className="dialog-modal"
      onClick={onClick}
      onClose={closeModal}
    >
      <CloseButton closeModal={closeModal} />
      {showSwitchButtons && (
        <>
          <button
            type="button"
            className="image-switch-button image-switch-button-left"
            aria-label="Previous image"
            onClick={() => onShowNextImage(-1)}
          >
            <FaChevronLeft size={28} />
          </button>
          <button
            type="button"
            className="image-switch-button image-switch-button-right"
            aria-label="Next image"
            onClick={() => onShowNextImage(1)}
          >
            <FaChevronRight size={28} />
          </button>
        </>
      )}
      <ImageContainer />
    </dialog>
  );
}
