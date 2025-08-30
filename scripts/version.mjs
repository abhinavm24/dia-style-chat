import { readFile, writeFile } from "fs/promises";

async function main() {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  const manifestPath = "manifest.json";
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  if (manifest.version !== pkg.version) {
    manifest.version = pkg.version;
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Synced manifest.json version -> ${pkg.version}`);
  } else {
    console.log(`manifest.json already at version ${pkg.version}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

