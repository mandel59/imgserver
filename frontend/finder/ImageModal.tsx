import { useAtom } from "jotai";
import { useEffect, useCallback } from "react";
import Hammer from "hammerjs";

import { 
  isImageModalOpenAtom, 
  selectedImageAtom,
  selectedImageIndexAtom,
  currentImagesAtom
} from "./states.ts";

export function BackDrop({ closeModal }: { closeModal: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        overflow: "hidden",
      }}
      onClick={closeModal}
    />
  );
}

export function CloseButton({ closeModal }: { closeModal: () => void }) {
  return (
    <button
      style={{
        position: "absolute",
        top: "20px",
        right: "30px",
        color: "white",
        fontSize: "40px",
        cursor: "pointer",
        background: "none",
        border: "none",
        padding: "0",
        zIndex: "1002",
      }}
      aria-label="Close modal"
      tabIndex={0}
      onClick={closeModal}
    >
      ×
    </button>
  );
}

export function ImageContainer() {
  const [selectedImage] = useAtom(selectedImageAtom);

  if (!selectedImage) {
    return null;
  }

  const src = `images/${selectedImage.path}`;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1001,
        pointerEvents: "none",
      }}
    >
      <img
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          padding: "20px",
          pointerEvents: "auto",
        }}
        src={src}
      />
    </div>
  );
}

export default function ImageModal(props: {}) {
  const [isImageModalOpen, setIsModalOpen] = useAtom(isImageModalOpenAtom);
  const [selectedImageIndex, setSelectedImageIndex] = useAtom(selectedImageIndexAtom);
  const [currentImages] = useAtom(currentImagesAtom);

  const display = isImageModalOpen ? "flex" : "none";

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
  }, [setIsModalOpen]);

  const showModal = useCallback(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }, []);

  // キーボード操作とスワイプ操作の設定
  useEffect(() => {
    if (!isImageModalOpen) return;

    showModal();

    const modal = document.getElementById("image-modal");
    if (!modal) return;

    // ハンマーJSでスワイプ操作を設定
    const hammer = new Hammer(modal);
    hammer.on("swipeleft", () => {
      if (currentImages.length === 0 || selectedImageIndex === -1) return;
      const newIndex = (selectedImageIndex + 1) % currentImages.length;
      setSelectedImageIndex(newIndex);
    });
    hammer.on("swiperight", () => {
      if (currentImages.length === 0 || selectedImageIndex === -1) return;
      const newIndex = (selectedImageIndex - 1 + currentImages.length) % currentImages.length;
      setSelectedImageIndex(newIndex);
    });

    // キーボード操作
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      } else if (
        (e.key === "ArrowRight" || e.key === "ArrowLeft") &&
        selectedImageIndex !== -1
      ) {
        // モディファイアキーが押されている場合は無視
        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
          return;
        }
        // 右/左矢印キーで画像切り替え
        const newIndex =
          (selectedImageIndex +
            (e.key === "ArrowRight" ? 1 : -1) +
            currentImages.length) %
          currentImages.length;
        setSelectedImageIndex(newIndex);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      hammer.destroy();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageModalOpen, selectedImageIndex, currentImages, setSelectedImageIndex, closeModal, showModal]);

  return (
    <div
      id="image-modal"
      style={{
        display,
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: 1000,
      }}
    >
      <BackDrop closeModal={closeModal} />
      <CloseButton closeModal={closeModal} />
      <ImageContainer />
    </div>
  );
}
