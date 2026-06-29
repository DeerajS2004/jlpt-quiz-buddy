# 🗾 JLPT Practice

A calm, sidebar-driven JLPT (N5–N1) mock-test app with the hush and precision of a Japanese stationery shop. Built with **TanStack Start + React 19 + Tailwind v4**, packaged as a cross-platform desktop app with **Tauri 2**.

> Paper & Hanko palette · Modern Sans typography (Space Grotesk / DM Sans) · Sidebar layout

---

## Features

- **Daily mock tests** — load any JSON question set, sit a timed session
- **5 categories** — Kanji (漢字), Vocabulary (語彙), Grammar (文法), Reading (読解), Expression (表現)
- **Configurable timer** — simulate real exam pressure (or turn it off)
- **No-spoiler quiz flow** — answers stay hidden until the end
- **Tabbed review** — Wrong / Correct / All on the results screen, defaulting to Wrong
- **Keyboard shortcuts** — `1–4` to pick an option, `← / →` to navigate, `Enter` to confirm
- **Lifetime statistics** — accuracy, streaks, per-category progress bars, last-12 session history
- **Local-only** — all progress stored in your browser/app via `localStorage`. No accounts, no cloud.

---

## Question file format

Drop a JSON file like this into **Load Test** (or pick the bundled **JLPT N5 Kanji** set):

```json
{
  "title": "JLPT N5 Kanji — Complete Set",
  "description": "Optional description",
  "questions": [
    {
      "id": 1,
      "type": "kanji",
      "question": "「一」の意味は何ですか？",
      "reading": "いち / ひと",
      "options": ["One", "Two", "Three", "Ten"],
      "answer": 0,
      "explanation": "一 (ichi/hito) = One."
    }
  ]
}
```

| Field         | Type    | Notes                                                            |
| ------------- | ------- | ---------------------------------------------------------------- |
| `type`        | string  | `kanji` · `vocabulary` · `grammar` · `reading` · `expression`    |
| `options`     | array   | Exactly 4 choices                                                |
| `answer`      | integer | 0-based index of the correct option                              |
| `reading`     | string  | Optional furigana / reading hint                                 |
| `explanation` | string  | Shown on the results page                                        |

A sample set lives at `public/quizzes/jlpt_n5_kanji_all.json` (110 N5 kanji questions).

---

## Run in the browser (dev)

```bash
bun install
bun run dev
```

Open <http://localhost:8080>.

Other handy scripts:

```bash
bun run build        # production web build (output: .output/public)
bun run preview      # serve the production build
bun run lint
bun run format
```

---

## Run as a desktop app (Tauri)

The app is wired up as a **Tauri 2** desktop shell. Tauri uses the system webview (WebKitGTK on Linux, WebView2 on Windows, WKWebView on macOS), so installers stay small (~10–15 MB) and start instantly.

### One-time prerequisites

1. **Node + Bun** — already required for the web app.
2. **Rust toolchain** — install via [rustup](https://rustup.rs):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. **Tauri CLI**:
   ```bash
   bun add -d @tauri-apps/cli
   ```
4. **Platform system deps** (see below).
5. **Generate platform icons** (one-time, from the bundled `src-tauri/icons/icon.png`):
   ```bash
   bun tauri icon src-tauri/icons/icon.png
   ```

### Pop!_OS / Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl wget file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### Windows 10/11

- Install **Microsoft Visual Studio C++ Build Tools** (with the "Desktop development with C++" workload).
- Install **WebView2 Runtime** (preinstalled on Windows 11; [download for Windows 10](https://developer.microsoft.com/microsoft-edge/webview2/)).

### macOS (optional)

```bash
xcode-select --install
```

---

### Develop the desktop app

```bash
bun run tauri:dev
```

This runs `bun run dev` in the background and opens the app in a native window pointed at `http://localhost:8080`. Hot reload works exactly like the browser.

### Build installers

```bash
bun run tauri:build
```

Output lands in `src-tauri/target/release/bundle/`:

| Platform | Artifacts |
| -------- | --------- |
| **Linux**   | `.deb` (Pop!_OS / Ubuntu / Debian), `.rpm` (Fedora), `.AppImage` (portable) |
| **Windows** | `.msi` and `.exe` (NSIS) installers |
| **macOS**   | `.app` bundle and `.dmg` |

#### Install on Pop!_OS

```bash
sudo dpkg -i src-tauri/target/release/bundle/deb/jlpt-practice_0.1.0_amd64.deb
# or just double-click the .AppImage:
chmod +x src-tauri/target/release/bundle/appimage/jlpt-practice_0.1.0_amd64.AppImage
./src-tauri/target/release/bundle/appimage/jlpt-practice_0.1.0_amd64.AppImage
```

The app appears in your launcher as **JLPT Practice**.

#### Install on Windows

Run the generated `.msi` (or `.exe`) from `src-tauri/target/release/bundle/`. The app is added to the Start menu as **JLPT Practice**.

> Tauri only builds installers for the OS you're running on. To produce a Windows `.msi` build it on Windows; for `.dmg` build on macOS.

---

## Project layout

```
.
├── public/quizzes/             # bundled question sets
├── src/
│   ├── components/             # UI + shadcn primitives
│   ├── lib/                    # quiz store, types, built-in quizzes
│   ├── routes/                 # TanStack Start file-based routes
│   │   ├── __root.tsx          # app shell + sidebar
│   │   ├── index.tsx           # Dashboard
│   │   ├── load.tsx            # Load Test
│   │   ├── quiz.tsx            # Active quiz engine
│   │   ├── results.tsx         # Wrong / Correct / All tabs
│   │   └── instructions.tsx
│   └── styles.css              # Paper & Hanko design tokens
└── src-tauri/                  # Rust + Tauri desktop shell
    ├── tauri.conf.json
    ├── Cargo.toml
    ├── build.rs
    ├── capabilities/default.json
    └── src/main.rs
```

---

## Resetting progress

Use **Reset all progress** at the bottom of the Dashboard, or clear the app's webview storage:

- Linux: `~/.local/share/app.lovable.jlpt-practice/`
- Windows: `%APPDATA%\app.lovable.jlpt-practice\`
- macOS: `~/Library/Application Support/app.lovable.jlpt-practice/`

---

がんばって! 🎌
