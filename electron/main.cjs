// Electron main process for JLPT Practice.
// - In dev: loads http://localhost:8080 (run `bun run dev` first, or use `bun run electron:dev`).
// - In production (packaged): spawns the built Nitro node server from `.output/server/index.mjs`
//   on a free port and loads it. localStorage lives in Electron's per-user `userData` dir,
//   so quiz history, stats, and streaks persist across launches and updates.

const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");
const http = require("http");

const isDev = !app.isPackaged;
let serverProc = null;
let serverUrl = null;

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.destroy();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) return reject(new Error("server timeout"));
        setTimeout(tick, 200);
      });
    };
    tick();
  });
}

async function startProdServer() {
  const port = await findFreePort();
  // In a packaged app, resources live under process.resourcesPath/app.
  const appRoot = app.isPackaged ? path.join(process.resourcesPath, "app") : path.join(__dirname, "..");
  const entry = path.join(appRoot, ".output", "server", "index.mjs");
  serverProc = spawn(process.execPath, [entry], {
    env: { ...process.env, PORT: String(port), NODE_ENV: "production", ELECTRON_RUN_AS_NODE: "1" },
    stdio: "inherit",
  });
  serverProc.on("exit", (code) => {
    console.log("[jlpt] server exited", code);
  });
  serverUrl = `http://127.0.0.1:${port}`;
  await waitForServer(serverUrl);
  return serverUrl;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#f5f3ee",
    title: "JLPT Practice",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const url = isDev ? "http://localhost:8080" : await startProdServer();
  await win.loadURL(url);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (serverProc) {
    try { serverProc.kill(); } catch {}
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
