import { useAtom } from "jotai";
import React, { useEffect, useCallback, useRef } from "react";
import Hammer from "hammerjs";
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
  const [isImageModalOpen, setIsModalOpen] = useAtom(isImageModalOpenAtom);
  const [selectedImageIndex] = useAtom(selectedImageIndexAtom);
  const [, onShowNextImage] = useAtom(onShowNextImageAtom);
  const [currentImages] = useAtom(currentImagesAtom);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  // モーダルの開閉制御とスワイプ操作
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isImageModalOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }

    // ハンマーJSでスワイプ操作を設定
    const hammer = new Hammer(dialog);
    hammer.on("swipeleft", () => {
      onShowNextImage(1);
    });
    hammer.on("swiperight", () => {
      onShowNextImage(-1);
    });

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
      hammer.destroy();
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageModalOpen, selectedImageIndex, currentImages, onShowNextImage]);

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
      ref={dialogRef}
      className="dialog-modal"
      onClick={onClick}
      onClose={closeModal}
    >
      <CloseButton closeModal={closeModal} />
      <ImageContainer />
    </dialog>
  );
}
