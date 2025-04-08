import Bun from "bun";
import app from "./src/server";

Bun.serve({
    port: 8000,
    fetch: app.fetch,
});

console.log("Server running on http://localhost:8000");
