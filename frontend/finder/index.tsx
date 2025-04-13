import { createRoot } from "react-dom/client";
import Finder from "./Finder.tsx";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

const rootElement = document.createElement("div");
rootElement.id = "react-root";
document.body.appendChild(rootElement);

const root = createRoot(rootElement);
root.render(
  <QueryClientProvider client={queryClient}>
    <Finder />
  </QueryClientProvider>
);
