export function BackDrop() {
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
    />
  );
}

export function CloseButton() {
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
    >
      ×
    </button>
  );
}

export function ImageContainer() {
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
      />
    </div>
  );
}

export default function ImageModal(props: {}) {
  return (
    <div
      id="image-modal"
      style={{
        display: "none",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: 1000,
      }}
    >
      <BackDrop />
      <CloseButton />
      <ImageContainer />
    </div>
  );
}
