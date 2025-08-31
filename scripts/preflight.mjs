import { access, constants, readFile, readdir } from "fs/promises";

const REQUIRED_FILES = [
  "background.js",
  "contentScript.js",
  "options.html",
  "options.js",
  "sidepanel.html",
  "sidepanel.css",
  "sidepanel.js",
  "shared.css"
];

const REQUIRED_ICONS = ["16", "32", "48", "64", "96", "128", "256"].map((s) => `icons/icon-${s}.png`);

function assert(cond, msg) {
  if (!cond) throw new Error(`Preflight: ${msg}`);
}

async function exists(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // Basic manifest checks
  const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
  assert(manifest.manifest_version === 3, "manifest_version must be 3");
  assert(!!manifest.name, "name is required");
  assert(!!manifest.version, "version is required");
  assert(!!manifest.background?.service_worker, "background.service_worker is required");
  assert(!!manifest.side_panel?.default_path, "side_panel.default_path is required (for Chrome)");

  // Files presence
  for (const f of REQUIRED_FILES) {
    assert(await exists(f), `missing file: ${f}`);
  }

  // Utilities folder present
  assert(await exists("lib"), "missing folder: lib (utility modules)");

  // Icons presence
  for (const icon of REQUIRED_ICONS) {
    assert(await exists(icon), `missing icon: ${icon}`);
  }

  // CSP recommendation: MV3 extension_pages exists
  const csp = manifest.content_security_policy?.extension_pages;
  assert(typeof csp === "string" && csp.includes("script-src 'self'"), "CSP extension_pages should restrict script-src to 'self'");

  // Permissions sanity
  const perms = manifest.permissions || [];
  assert(Array.isArray(perms), "permissions must be array");
  assert(perms.includes("storage"), "permissions should include storage");
  assert(perms.includes("scripting"), "permissions should include scripting");

  // host_permissions must include Google Generative Language API for current code
  const hp = manifest.host_permissions || [];
  assert(hp.some((h) => String(h).includes("generativelanguage.googleapis.com")), "host_permissions should include Google Generative Language API endpoint");

  // Content scripts
  const cs = manifest.content_scripts || [];
  assert(cs.length > 0, "content_scripts must be defined");
  assert(cs[0].js?.includes("contentScript.js"), "contentScript.js must be in content_scripts");

  console.log("Preflight OK: manifest and files validated.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
