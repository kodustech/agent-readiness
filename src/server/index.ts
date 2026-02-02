import path from "node:path";
import type { SerializedReportData } from "../engine/serializer.js";

const DIST_WEB_DIR = path.resolve(import.meta.dir, "../../dist/web");

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
 * Starts a Bun HTTP server that serves the pre-built SPA
 * with the report JSON injected into the HTML.
 *
 * Returns the server instance and the URL it's listening on.
 */
export async function startServer(reportData: SerializedReportData): Promise<{
  server: ReturnType<typeof Bun.serve>;
  url: string;
}> {
  // Read the index.html template
  const indexPath = path.join(DIST_WEB_DIR, "index.html");
  const indexFile = Bun.file(indexPath);

  if (!(await indexFile.exists())) {
    throw new Error(
      `Web dashboard not built. Run "bun run build:web" first.\n` +
        `Expected files at: ${DIST_WEB_DIR}`,
    );
  }

  const indexHtml = await indexFile.text();

  // Inject report data into HTML
  const jsonPayload = JSON.stringify(reportData);
  const injectedHtml = indexHtml.replace(
    "</head>",
    `<script>window.__KODUS_REPORT_DATA__ = ${jsonPayload};</script>\n</head>`,
  );

  const server = Bun.serve({
    port: 0, // random available port
    async fetch(req) {
      const url = new URL(req.url);
      let pathname = url.pathname;

      // Serve injected index.html for root and SPA fallback
      if (pathname === "/" || pathname === "/index.html") {
        return new Response(injectedHtml, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // Try to serve static file from dist/web
      const filePath = path.join(DIST_WEB_DIR, pathname);

      // Prevent directory traversal
      if (!filePath.startsWith(DIST_WEB_DIR)) {
        return new Response("Forbidden", { status: 403 });
      }

      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file, {
          headers: { "Content-Type": getMimeType(filePath) },
        });
      }

      // SPA fallback: serve injected index.html for unknown routes
      return new Response(injectedHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    },
  });

  const url = `http://localhost:${server.port}`;
  return { server, url };
}

/**
 * Opens the given URL in the default browser.
 */
export async function openBrowser(url: string): Promise<void> {
  const proc = Bun.spawn({
    cmd:
      process.platform === "darwin"
        ? ["open", url]
        : process.platform === "win32"
          ? ["cmd", "/c", "start", url]
          : ["xdg-open", url],
    stdout: "ignore",
    stderr: "ignore",
  });
  await proc.exited;
}
