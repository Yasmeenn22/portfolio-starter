// Serves the built site (out/) like GitHub Pages does: gzip, long caching for hashed files,
// folder -> index.html, unknown paths -> 404.html.   node scripts/serve.mjs [port] [folder]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const PORT = Number(process.argv[2] || 4173);
const OUT = path.resolve(process.argv[3] || "out"); // optional: another build folder
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8", ".json": "application/json" };
const TEXT = new Set([".html", ".js", ".css", ".svg", ".txt", ".json"]);

createServer(async (req, res) => {
  let file = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  let status = 200;
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    await stat(file);
  } catch {
    file = path.join(OUT, "404.html");
    status = 404;
  }
  let body = await readFile(file);
  const ext = path.extname(file);
  const headers = { "content-type": TYPES[ext] || "application/octet-stream" };
  headers["cache-control"] = file.includes(`${path.sep}_next${path.sep}static${path.sep}`) ? "public, max-age=31536000, immutable" : "public, max-age=600";
  if (TEXT.has(ext) && /gzip/.test(req.headers["accept-encoding"] || "")) {
    body = gzipSync(body);
    headers["content-encoding"] = "gzip";
  }
  res.writeHead(status, headers);
  res.end(body);
}).listen(PORT, "127.0.0.1", () => console.log(`serving out/ on http://127.0.0.1:${PORT}/`));
