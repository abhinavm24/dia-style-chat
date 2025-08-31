import { access, constants, stat, readFile } from "fs/promises";
import { join } from "path";

async function exists(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // Ensure dist bundles exist and look sane
  const chromeDir = "dist/chrome";
  const firefoxDir = "dist/firefox";
  if (!(await exists(chromeDir))) throw new Error("dist/chrome missing; build failed");
  if (!(await exists(firefoxDir))) throw new Error("dist/firefox missing; build failed");

  // Verify Firefox manifest was transformed for sidebar and permissions adjusted
  const ffManifest = JSON.parse(await readFile(join(firefoxDir, "manifest.json"), "utf8"));
  if (!ffManifest.sidebar_action) throw new Error("Firefox manifest missing sidebar_action");
  if (ffManifest.side_panel) throw new Error("Firefox manifest still contains side_panel");
  if (Array.isArray(ffManifest.permissions) && ffManifest.permissions.includes("sidePanel")) {
    throw new Error("Firefox manifest should not include sidePanel permission");
  }

  // Packaging output exists
  const releaseOk = await exists("release");
  if (!releaseOk) throw new Error("release/ folder missing; packaging failed");
  console.log("Verify OK: dist and release artifacts look good.");
}

main().catch((err) => {
  console.error("Verify failed:", err.message || err);
  process.exit(1);
});
