import path from "node:path";
import fs from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import type { SerializedReportData } from "../engine/serializer.js";

function getCurrentDir(): string {
  // Bun provides import.meta.dir, Node uses import.meta.dirname (21+) or fileURLToPath
  if (typeof import.meta.dir === "string") return import.meta.dir;
  if (typeof import.meta.dirname === "string") return import.meta.dirname;
  return path.dirname(fileURLToPath(import.meta.url));
}

function findWebDir(): string {
  const currentDir = getCurrentDir();
  // When bundled: currentDir = .../dist/, web is at dist/web
  const bundled = path.resolve(currentDir, "web");
  // When running from source: currentDir = .../src/server/, web is at ../../dist/web
  const source = path.resolve(currentDir, "../../dist/web");

  if (fs.existsSync(bundled)) return bundled;
  if (fs.existsSync(source)) return source;
  return bundled; // fallback for error message
}

const DIST_WEB_DIR = findWebDir();

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

/**
 * Starts an HTTP server that serves the pre-built SPA
 * with the report JSON injected into the HTML.
 *
 * Returns the server instance and the URL it's listening on.
 */
export async function startServer(reportData: SerializedReportData): Promise<{
  server: http.Server;
  url: string;
}> {
  const indexPath = path.join(DIST_WEB_DIR, "index.html");

  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `Web dashboard not built. Run "bun run build:web" first.\n` +
        `Expected files at: ${DIST_WEB_DIR}`,
    );
  }

  const indexHtml = fs.readFileSync(indexPath, "utf-8");

  // Inject report data into HTML
  const jsonPayload = JSON.stringify(reportData);
  const injectedHtml = indexHtml.replace(
    "</head>",
    `<script>window.__KODUS_REPORT_DATA__ = ${jsonPayload};</script>\n</head>`,
  );

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Serve injected index.html for root and SPA fallback
    if (pathname === "/" || pathname === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(injectedHtml);
      return;
    }

    // Try to serve static file from dist/web
    const filePath = path.join(DIST_WEB_DIR, pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(DIST_WEB_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": getMimeType(filePath) });
      res.end(content);
      return;
    }

    // SPA fallback: serve injected index.html for unknown routes
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(injectedHtml);
  });

  const port = 10010;
  return new Promise((resolve) => {
    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      resolve({ server, url });
    });
  });
}

/**
 * Opens the given URL in the default browser.
 */
export async function openBrowser(url: string): Promise<void> {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;

  return new Promise((resolve) => {
    exec(cmd, () => resolve());
  });
}
