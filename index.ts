import Bun from "bun";
import app from "./backend/app";
import oldViewer from "./frontend/old_impl/index.html";

Bun.serve({
  port: 8000,
  routes: {
    "/": oldViewer,
  },
  fetch: app.fetch,
});

console.log("Server running on http://localhost:8000");
