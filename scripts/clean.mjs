import { rm } from "fs/promises";

async function clean() {
  await rm("dist", { recursive: true, force: true }).catch(() => {});
  await rm("release", { recursive: true, force: true }).catch(() => {});
}

clean().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

