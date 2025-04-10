import Bun from "bun";
import app from "./backend/app";
import viewer from "./frontend/index.html";

Bun.serve({
  port: 8000,
  routes: {
    "/": viewer,
  },
  fetch: app.fetch,
});

console.log("Server running on http://localhost:8000");
