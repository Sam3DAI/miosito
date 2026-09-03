import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "_site");
const port = Number(process.argv[2] ?? 8090);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".xml", "application/xml; charset=utf-8"]
]);

function resolveRequestPath(rawUrl) {
  const pathname = decodeURIComponent(new URL(rawUrl, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidates = path.extname(relative) ? [relative] : [`${relative}.html`, path.join(relative, "index.html")];
  for (const candidate of candidates) {
    const absolute = path.resolve(outputRoot, candidate);
    if (!absolute.startsWith(`${outputRoot}${path.sep}`) && absolute !== outputRoot) continue;
    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) return absolute;
  }
  return null;
}

const server = http.createServer((request, response) => {
  const absolute = resolveRequestPath(request.url ?? "/");
  if (!absolute) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = path.extname(absolute).toLowerCase();
  let body = fs.readFileSync(absolute);
  if (extension === ".html") {
    body = Buffer.from(body.toString("utf8").replace(/<script\b[\s\S]*?<\/script>/gi, ""), "utf8");
  }
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
    "X-SolveX-No-JS-Simulation": "scripts-stripped"
  });
  response.end(body);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`SOLVEX_NO_JS_SERVER=http://127.0.0.1:${port}`);
});
