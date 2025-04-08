import Bun from "bun";
import index from "./static/index.html";
import app from "./src/server";

Bun.serve({
    port: 8000,
    routes: {
        "/": index,
    },
    fetch: app.fetch,
});

console.log("Server running on http://localhost:8000");
