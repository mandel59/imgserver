import Bun from "bun";
import app from "./backend/app";
import finder from "./frontend/finder/index.html";

Bun.serve({
  port: 8000,
  routes: {
    "/": finder,
  },
  fetch: app.fetch,
});

console.log("Server running on http://localhost:8000");
