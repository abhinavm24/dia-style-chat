import { mkdir } from "fs/promises";
import { join, basename } from "path";
import { execFile } from "child_process";

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

async function zipDir(dir, outFile) {
  // Prefer system `zip`; fallback to Python stdlib if unavailable
  try {
    await run("zip", ["-X", "-r", "-q", outFile, "."], { cwd: dir });
  } catch (err) {
    // Fallback: python3 -m zipfile -c out.zip .
    try {
      await run("python3", ["-m", "zipfile", "-c", outFile, "."], { cwd: dir });
    } catch (err2) {
      throw err2;
    }
  }
}

async function main() {
  const pkg = (await import(join(process.cwd(), "../package.json"), { assert: { type: "json" } })).default;
  const version = pkg.version;
  const outDir = join(process.cwd(), "release");
  await mkdir(outDir, { recursive: true });

  const chromeDir = join(process.cwd(), "dist", "chrome");
  const firefoxDir = join(process.cwd(), "dist", "firefox");

  const chromeZip = join(outDir, `TabChat-${version}-chrome.zip`);
  const firefoxZip = join(outDir, `TabChat-${version}-firefox.zip`);

  await zipDir(chromeDir, chromeZip);
  await zipDir(firefoxDir, firefoxZip);

  console.log("Packaged:");
  console.log(" - " + chromeZip);
  console.log(" - " + firefoxZip);
}

main().catch((err) => {
  console.error("Packaging failed. Ensure `zip` or Python 3 is available.");
  if (err && err.stderr) console.error(String(err.stderr));
  process.exitCode = 1;
});
