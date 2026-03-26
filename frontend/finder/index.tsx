import { createRoot } from "react-dom/client";
import Finder from "./Finder.tsx";
import "./style.css";

const rootElement = document.createElement("div");
rootElement.id = "react-root";
document.body.appendChild(rootElement);

const root = createRoot(rootElement);
root.render(<Finder />);
