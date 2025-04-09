export function setupModal() {
  // モーダル要素を取得
  const modal = document.getElementById("image-modal") as HTMLDivElement;
  const modalImg = modal.querySelector("img") as HTMLImageElement;
  const closeBtn = modal.querySelector("button") as HTMLButtonElement;
  const backdrop = modal.querySelector("div")!;

  // モーダル表示時にスクロールを無効化
  function showModal() {
    modal.style.display = "flex";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  // モーダル非表示時にスクロールを有効化
  function hideModal() {
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
  }

  // モーダルを閉じる
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    hideModal();
  });

  // バックドロップクリックでモーダルを閉じる
  backdrop.addEventListener("click", () => {
    modal.style.display = "none";
    hideModal();
  });

  // キーボード操作
  document.addEventListener("keydown", (e) => {
    if (modal.style.display === "flex" && e.key === "Escape") {
      modal.style.display = "none";
      hideModal();
    }
  });

  return {
    modal,
    modalImg,
    closeBtn,
    backdrop,
    showModal,
    hideModal
  };
}
