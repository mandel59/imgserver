import { createRoot } from "react-dom/client";
import { useState } from "react";
import Finder from "./Finder.tsx";

const rootElement = document.createElement("div");
rootElement.id = "react-root";
document.body.appendChild(rootElement);

function App() {
  const [currentPath, setCurrentPath] = useState("");

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    // ここにURL更新ロジックを追加可能
  };

  return <Finder currentPath={currentPath} onNavigate={handleNavigate} />;
}

const root = createRoot(rootElement);
root.render(<App />);
