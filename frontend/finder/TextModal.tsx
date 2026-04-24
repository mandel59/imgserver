import { useAtom, useAtomValue, useStore } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import "./ImageModal.css";
import "./TextModal.css";

import { CloseButton } from "./ImageModal.tsx";
import { fetchTextFileContent } from "./api.ts";
import { currentArchiveAtom } from "./states/location.ts";
import {
  isTextModalOpenAtom,
  selectedTextPathAtom,
} from "./states/text.ts";
import type { TextFileContent } from "@/common/types.ts";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
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
  if (timestamp <= 0) return "";
  return new Date(timestamp).toLocaleString();
}

function statusText(error: string | null) {
  if (!error) return "Loading...";
  if (error.startsWith("Error 413:")) {
    return "ファイルが大きすぎるため表示できません。";
  }
  if (error.startsWith("Error 415:")) {
    return "テキストとして読み込めませんでした。";
  }
  return "テキストを読み込めませんでした。";
}

export default function TextModal() {
  const store = useStore();
  const [isTextModalOpen, setIsTextModalOpen] = useAtom(isTextModalOpenAtom);
  const selectedTextPath = useAtomValue(selectedTextPathAtom);
  const archive = useAtomValue(currentArchiveAtom);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [content, setContent] = useState<TextFileContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isTextModalOpen || !selectedTextPath) {
      setContent(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let ignore = false;
    setIsLoading(true);
    setError(null);
    setContent(null);
    fetchTextFileContent(selectedTextPath, archive)
      .then((nextContent) => {
        if (!ignore) {
          setContent(nextContent);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(String(err?.message ?? err));
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [archive, isTextModalOpen, selectedTextPath]);

  const closeModal = useCallback(() => {
    setIsTextModalOpen(false);
    dialogRef.current?.close();
  }, [setIsTextModalOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      const path = store.get(selectedTextPathAtom);
      const fileName = path.split("/").pop();
      if (fileName) {
        requestAnimationFrame(() => {
          const el = Array.from(
            document.querySelectorAll<HTMLElement>(".file-item")
          ).find((item) => item.dataset.fileName === fileName);
          el?.focus();
        });
      }
      store.set(isTextModalOpenAtom, false);
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleClose);

    if (isTextModalOpen) {
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

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleClose);
      document.body.style.overflow = "";
    };
  }, [isTextModalOpen, store]);

  const onClick = useCallback((e: React.MouseEvent) => {
    const dialog = dialogRef.current;
    if (e.target === dialog) {
      dialog.close();
    }
  }, []);

  const modified = content ? formatDate(content.modified) : "";

  return (
    <dialog
      aria-label="Text file"
      ref={dialogRef}
      className="dialog-modal"
      onClick={onClick}
      onClose={closeModal}
    >
      <CloseButton closeModal={closeModal} />
      <section className="text-modal-panel">
        <header className="text-modal-header">
          <h2 className="text-modal-title">
            {content?.name ?? selectedTextPath.split("/").pop() ?? "Text file"}
          </h2>
          {content && (
            <div className="text-modal-meta">
              <span>{formatBytes(content.size)}</span>
              {modified ? <span>{modified}</span> : null}
            </div>
          )}
        </header>
        <div className="text-modal-body">
          {isLoading || error ? (
            <p className="text-modal-status">{statusText(error)}</p>
          ) : (
            <pre className="text-modal-content">{content?.content ?? ""}</pre>
          )}
        </div>
      </section>
    </dialog>
  );
}
