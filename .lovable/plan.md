## Goal

Automate Linux desktop builds for the JLPT Practice Tauri app using GitHub Actions. Pushing a `v*` tag (e.g. `v0.1.0`) builds `.deb` and `.AppImage` installers on an Ubuntu runner and publishes them to a GitHub Release you can download onto Pop!_OS.

## What gets added

**One new file:** `.github/workflows/release.yml`

**One tiny README addition:** a "Releases via GitHub Actions" subsection under the desktop-build section explaining how to cut a release with a tag.

No app code changes. No changes to `src-tauri/`, `package.json`, or existing scripts.

## Workflow shape

```text
Trigger:  push tag matching v*
Runner:   ubuntu-22.04   (Ubuntu 22.04 is Pop!_OS 22.04's base — .deb will install cleanly)

Steps:
  1. checkout
  2. setup Bun (oven-sh/setup-bun)
  3. setup Rust stable (dtolnay/rust-toolchain) + cargo cache (swatinem/rust-cache)
  4. apt install Tauri Linux deps:
        libwebkit2gtk-4.1-dev build-essential curl wget file
        libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  5. bun install --frozen-lockfile
  6. bun run build                       # produces .output/public
  7. bun x tauri build                   # produces .deb + .AppImage in src-tauri/target/release/bundle/
  8. tauri-apps/tauri-action (or softprops/action-gh-release) to create a
     GitHub Release for the tag and upload:
        src-tauri/target/release/bundle/deb/*.deb
        src-tauri/target/release/bundle/appimage/*.AppImage
```

Uses `GITHUB_TOKEN` (auto-provided) for release upload — no secrets to configure.

## Release flow for you

```bash
# bump version in package.json + src-tauri/tauri.conf.json + src-tauri/Cargo.toml, then:
git tag v0.1.1
git push origin v0.1.1
```

Actions tab shows the build; when it finishes, the Releases page has `.deb` and `.AppImage` attached, ready to download and install on Pop!_OS.

## Notes / choices

- **Runner: `ubuntu-22.04`** rather than `ubuntu-latest`. `ubuntu-latest` currently points at 24.04, which ships `libwebkit2gtk-4.1` linked against a newer glibc — a `.deb` built there may fail to install on Pop!_OS 22.04. 22.04 is the safe lowest common denominator; you can bump later.
- **Action choice:** `tauri-apps/tauri-action@v0` handles build + release upload in one step and is the officially recommended path. Falls back cleanly if you ever want to add Windows/macOS runners later — just add entries to a `matrix.platform`.
- **Icons:** the workflow assumes `src-tauri/icons/` already contains generated platform icons (the README's one-time `bun tauri icon` step). If they're missing the build will fail; easy to add a generate-icons step later if needed.
- **No code signing** for Linux — not required for `.deb`/`.AppImage`.

## Out of scope (per your answers)

- Windows `.msi`/`.exe` and macOS `.dmg` builds
- Manual `workflow_dispatch` trigger
- Auto-updater endpoint / signed updates
