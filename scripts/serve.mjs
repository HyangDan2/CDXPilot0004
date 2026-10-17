import { fileURLToPath } from "node:url";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, "");
const basePath =
  "/" + (process.env.BASE_PATH || "").split("/").filter(Boolean).join("/");
const prefix = basePath === "/" ? "" : basePath;
const types = {
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};
const server = http.createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (prefix && pathname === prefix) {
      response.writeHead(301, { Location: prefix + "/" }).end();
      return;
    }
    if (prefix && !pathname.startsWith(prefix + "/")) {
      response.writeHead(404).end("Not found");
      return;
    }
    pathname = pathname.slice(prefix.length);
    const file = resolve(
      root,
      "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname),
    );
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const data = await readFile(file);
    response.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch {
    response.writeHead(404).end("Not found");
  }
});
server.listen(Number(process.env.PORT ?? 8765), "127.0.0.1", () =>
  console.log(
    `Particle Beat: http://127.0.0.1:${server.address().port}${prefix}/`,
  ),
);
