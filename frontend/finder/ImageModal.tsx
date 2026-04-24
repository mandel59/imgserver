import { useAtom, useAtomValue, useStore } from "jotai";
import React, { useEffect, useCallback, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { FaChevronLeft, FaChevronRight, FaInfo, FaTimes } from "react-icons/fa";
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
import { fetchImageMetadata, fetchRuntimeOptions } from "./api.ts";
import type {
  ImageMetadata,
  MetadataTextEntry,
  RuntimeFeatureOptions,
} from "@/common/types.ts";

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

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  const units = ["KB", "MB", "GB"];
  let value = size / 1024;
  for (const unit of units) {
    if (value < 1024 || unit === units[units.length - 1]) {
      return `${value.toFixed(value < 10 ? 1 : 0)} ${unit}`;
    }
    value /= 1024;
  }
  return `${size} B`;
}

function formatDate(timestamp: number) {
  if (timestamp <= 0) {
    return "Unknown";
  }
  return new Date(timestamp).toLocaleString();
}

function MetadataTextEntries({ entries }: { entries: MetadataTextEntry[] }) {
  return (
    <section className="metadata-text-section">
      <h2>Text data</h2>
      {entries.map((entry, index) => (
        <details
          className="metadata-text-entry"
          key={`${entry.kind}-${entry.label}-${index}`}
        >
          <summary>
            <span>
              {entry.translatedLabel || entry.label}
              {entry.language ? ` (${entry.language})` : ""}
              {entry.compressed ? " compressed" : ""}
            </span>
            <span>{formatBytes(entry.valueLength)}</span>
          </summary>
          <pre>{entry.value}</pre>
          {entry.truncated && (
            <p>
              Showing first {formatBytes(entry.value.length)} of{" "}
              {formatBytes(entry.valueLength)}.
            </p>
          )}
        </details>
      ))}
    </section>
  );
}

function MetadataPanel({
  metadata,
  error,
  isLoading,
}: {
  metadata: ImageMetadata | null;
  error: string | null;
  isLoading: boolean;
}) {
  const rows = metadata
    ? [
        ["Name", metadata.name],
        ["Format", metadata.format?.toUpperCase()],
        [
          "Dimensions",
          metadata.width && metadata.height
            ? `${metadata.width} x ${metadata.height}`
            : undefined,
        ],
        ["Size", formatBytes(metadata.size)],
        ["Modified", formatDate(metadata.modified)],
        ["Color space", metadata.space],
        ["Channels", metadata.channels?.toString()],
        ["Depth", metadata.depth],
        ["Alpha", metadata.hasAlpha == null ? undefined : metadata.hasAlpha ? "Yes" : "No"],
        ["Orientation", metadata.orientation?.toString()],
        ["Pages", metadata.pages?.toString()],
      ].filter((row): row is [string, string] => Boolean(row[1]))
    : [];

  return (
    <aside className="metadata-panel" aria-label="Image metadata">
      {isLoading && <p className="metadata-status">Loading...</p>}
      {error && <p className="metadata-status">{error}</p>}
      {!isLoading && !error && metadata && (
        <>
          <dl>
            {rows.map(([label, value]) => (
              <React.Fragment key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </React.Fragment>
            ))}
          </dl>
          {metadata.textEntries && metadata.textEntries.length > 0 && (
            <MetadataTextEntries entries={metadata.textEntries} />
          )}
        </>
      )}
    </aside>
  );
}

export default function ImageModal() {
  const store = useStore();
  const [isImageModalOpen, setIsModalOpen] = useAtom(isImageModalOpenAtom);
  const [, onShowNextImage] = useAtom(onShowNextImageAtom);
  const images = useAtomValue(currentImagesAtom);
  const selectedImageIndex = useAtomValue(selectedImageIndexAtom);
  const selectedImagePath = useAtomValue(selectedImagePathAtom);
  const archive = useAtomValue(currentArchiveAtom);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [runtimeOptions, setRuntimeOptions] =
    useState<RuntimeFeatureOptions | null>(null);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchRuntimeOptions()
      .then((options) => {
        if (!ignore) {
          setRuntimeOptions(options);
        }
      })
      .catch(() => {
        if (!ignore) {
          setRuntimeOptions({ showMetadata: false });
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setIsMetadataOpen(false);
    setMetadata(null);
    setMetadataError(null);
  }, [selectedImagePath, archive]);

  useEffect(() => {
    if (!runtimeOptions?.showMetadata || !isMetadataOpen || !selectedImagePath) {
      return;
    }

    let ignore = false;
    setIsMetadataLoading(true);
    setMetadataError(null);
    fetchImageMetadata(selectedImagePath, archive)
      .then((nextMetadata) => {
        if (!ignore) {
          setMetadata(nextMetadata);
        }
      })
      .catch(() => {
        if (!ignore) {
          setMetadataError("Metadata unavailable");
          setMetadata(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsMetadataLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [runtimeOptions?.showMetadata, isMetadataOpen, selectedImagePath, archive]);

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
  const showMetadataButton = isImageModalOpen && runtimeOptions?.showMetadata;

  return (
    <dialog
      aria-label="Image"
      ref={mergedRef}
      className="dialog-modal"
      onClick={onClick}
      onClose={closeModal}
    >
      <CloseButton closeModal={closeModal} />
      {showMetadataButton && (
        <button
          type="button"
          className="metadata-button"
          aria-label="Show image metadata"
          aria-pressed={isMetadataOpen}
          onClick={() => setIsMetadataOpen((open) => !open)}
        >
          <FaInfo size={18} />
        </button>
      )}
      {showMetadataButton && isMetadataOpen && (
        <MetadataPanel
          metadata={metadata}
          error={metadataError}
          isLoading={isMetadataLoading}
        />
      )}
      {showSwitchButtons && (
        <>
          <button
            type="button"
            className="image-switch-button image-switch-button-left"
            aria-label="Previous image"
            onClick={() => onShowNextImage(-1)}
          >
            <FaChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="image-switch-button image-switch-button-right"
            aria-label="Next image"
            onClick={() => onShowNextImage(1)}
          >
            <FaChevronRight size={24} />
          </button>
        </>
      )}
      <ImageContainer />
    </dialog>
  );
}
