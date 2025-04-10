import { useAtom } from "jotai";

import { isImageModalOpenAtom, selectedImageAtom } from "./states.ts";
import { useCallback } from "react";

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

  const display = isImageModalOpen ? "flex" : "none";

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

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
