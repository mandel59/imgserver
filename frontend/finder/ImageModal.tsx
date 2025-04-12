import { useAtom, useAtomValue, useStore } from "jotai";
import React, { useEffect, useCallback, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { FaTimes } from "react-icons/fa";
import "./ImageModal.css";

import {
  isImageModalOpenAtom,
  selectedImageIndexAtom,
  currentImagesAtom,
  onShowNextImageAtom,
  selectedImagePathAtom,
} from "./states.ts";

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

export function ImageContainer() {
  const [selectedImagePath] = useAtom(selectedImagePathAtom);

  if (!selectedImagePath) {
    return null;
  }

  const src = `images/${selectedImagePath}`;

  return (
    <div className="image-container">
      <img src={src} />
    </div>
  );
}

export default function ImageModal() {
  const store = useStore();
  const [isImageModalOpen, setIsModalOpen] = useAtom(isImageModalOpenAtom);
  const [selectedImageIndex] = useAtom(selectedImageIndexAtom);
  const [, onShowNextImage] = useAtom(onShowNextImageAtom);
  const [currentImages] = useAtom(currentImagesAtom);
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
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  // モーダルの開閉制御
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      const index = store.get(selectedImageIndexAtom);
      const images = store.get(currentImagesAtom);
      const image = images[index ?? -1];
      if (image) {
        const el = document.querySelector<HTMLElement>(
          `[data-file-name="${image.name}"]`
        );
        console.log(el);
        el?.focus();
      }
    };

    const handleCancel = (e: Event) => {
      requestAnimationFrame(() => handleClose());
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);

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
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [
    isImageModalOpen,
    selectedImageIndex,
    currentImages,
    onShowNextImage,
    store,
  ]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === dialogRef.current) {
        closeModal();
      }
    },
    [closeModal]
  );

  return (
    <dialog
      aria-label="Image"
      ref={mergedRef}
      className="dialog-modal"
      onClick={onClick}
      onClose={closeModal}
    >
      <CloseButton closeModal={closeModal} />
      <ImageContainer />
    </dialog>
  );
}
