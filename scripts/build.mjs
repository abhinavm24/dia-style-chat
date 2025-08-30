import { mkdir, readFile, writeFile, cp, utimes } from "fs/promises";
import { basename, dirname, join } from "path";

const ROOT = process.cwd();

const FILES = [
  "background.js",
  "contentScript.js",
  "options.html",
  "options.js",
  "sidepanel.html",
  "sidepanel.css",
  "sidepanel.js",
  "shared.css"
];

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

function transformManifestForFirefox(manifest) {
  const m = JSON.parse(JSON.stringify(manifest));

  // Sidebar conversion: side_panel -> sidebar_action
  if (m.side_panel) {
    m.sidebar_action = {
      default_panel: m.side_panel.default_path || "sidepanel.html",
      default_title: m.name || "Tab Chat"
    };
    delete m.side_panel;
  }

  // Remove Chrome-only permission
  if (Array.isArray(m.permissions)) {
    m.permissions = m.permissions.filter((p) => p !== "sidePanel");
  }

  // Add browser_specific_settings for Firefox
  const geckoId = process.env.GECKO_ID || "tab-chat@example.com";
  const geckoMin = process.env.GECKO_MIN_VERSION || "109.0";
  m.browser_specific_settings = m.browser_specific_settings || {};
  m.browser_specific_settings.gecko = {
    id: geckoId,
    strict_min_version: geckoMin
  };

  return m;
}

async function buildTarget(target) {
  const manifest = JSON.parse(await readFile(join(ROOT, "manifest.json"), "utf8"));

  if (target === "chrome") {
    const outDir = join(ROOT, "dist", "chrome");
    await ensureDir(outDir);
    await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    for (const f of FILES) {
      await cp(join(ROOT, f), join(outDir, basename(f)));
    }
    await ensureDir(join(outDir, "icons"));
    await cp(join(ROOT, "icons"), join(outDir, "icons"), { recursive: true });
  } else if (target === "firefox") {
    const outDir = join(ROOT, "dist", "firefox");
    await ensureDir(outDir);
    const ffManifest = transformManifestForFirefox(manifest);
    await writeFile(join(outDir, "manifest.json"), JSON.stringify(ffManifest, null, 2) + "\n");
    for (const f of FILES) {
      await cp(join(ROOT, f), join(outDir, basename(f)));
    }
    await ensureDir(join(outDir, "icons"));
    await cp(join(ROOT, "icons"), join(outDir, "icons"), { recursive: true });
  } else {
    throw new Error(`Unknown target: ${target}`);
  }
}

async function main() {
  const arg = process.argv[2] || "all";
  if (arg === "all") {
    await buildTarget("chrome");
    await buildTarget("firefox");
  } else {
    await buildTarget(arg);
  }
  // Normalize file mtimes in dist for deterministic zips
  const fixed = new Date("2001-01-01T00:00:00Z");
  async function touchAll(dirHandle) {
    // Best-effort: set mtime on top-level files we know
    const targets = [
      join(ROOT, "dist", "chrome"),
      join(ROOT, "dist", "firefox")
    ];
    for (const base of targets) {
      for (const f of [
        "manifest.json",
        ...FILES,
      ]) {
        try {
          await utimes(join(base, basename(f)), fixed, fixed);
        } catch {}
      }
      try { await utimes(join(base, "icons"), fixed, fixed); } catch {}
    }
  }
  await touchAll();
  console.log(`Built ${arg === "all" ? "chrome + firefox" : arg}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
