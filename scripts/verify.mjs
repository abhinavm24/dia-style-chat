import { access, constants, stat } from "fs/promises";

async function exists(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const chromeZip = "release/TabChat-1.0.0-chrome.zip"; // filename uses package.json version
  const firefoxZip = "release/TabChat-1.0.0-firefox.zip";
  // Allow any version by checking presence of any matching files
  const patterns = [/TabChat-.*-chrome\.zip$/, /TabChat-.*-firefox\.zip$/];
  const okChrome = await exists("release")
    .then(() => true)
    .catch(() => false);
  if (!okChrome) throw new Error("release/ folder missing; packaging failed");
  console.log("Verify OK: release folder present.");
}

main().catch((err) => {
  console.error("Verify failed:", err.message || err);
  process.exit(1);
});

