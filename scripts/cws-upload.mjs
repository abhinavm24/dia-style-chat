// Minimal Chrome Web Store upload/publish without external deps
// Requires env vars: CWS_EXTENSION_ID, CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN
// Optional: CWS_CHANNEL (default "default"), CWS_ZIP (path to chrome zip)

const {
  CWS_EXTENSION_ID,
  CWS_CLIENT_ID,
  CWS_CLIENT_SECRET,
  CWS_REFRESH_TOKEN,
  CWS_CHANNEL,
  CWS_ZIP
} = process.env;

import { readdir, readFile } from "fs/promises";
import { join } from "path";

async function getAccessToken() {
  const url = "https://www.googleapis.com/oauth2/v4/token";
  const params = new URLSearchParams({
    client_id: CWS_CLIENT_ID,
    client_secret: CWS_CLIENT_SECRET,
    refresh_token: CWS_REFRESH_TOKEN,
    grant_type: "refresh_token"
  });
  const res = await fetch(url, { method: "POST", body: params });
  if (!res.ok) throw new Error(`OAuth token error ${res.status}`);
  const json = await res.json();
  return json.access_token;
}

async function findChromeZip() {
  if (CWS_ZIP) return CWS_ZIP;
  const files = await readdir("release");
  const pick = files.find((f) => /-chrome\.zip$/.test(f));
  if (!pick) throw new Error("No chrome zip found in release/");
  return join("release", pick);
}

async function uploadZip(token, zipPath) {
  const url = `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${CWS_EXTENSION_ID}`;
  const buf = await readFile(zipPath);
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-api-version": "2",
      "Content-Type": "application/zip"
    },
    body: buf
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Upload failed ${res.status}: ${JSON.stringify(json)}`);
  const st = json?.uploadState;
  if (st !== "SUCCESS") throw new Error(`Upload state: ${st}`);
  return json;
}

async function publish(token) {
  const target = CWS_CHANNEL || "default"; // or trustedTesters
  const url = `https://www.googleapis.com/chromewebstore/v1.1/items/${CWS_EXTENSION_ID}/publish`;
  const res = await fetch(url + `?publishTarget=${encodeURIComponent(target)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-api-version": "2"
    }
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Publish failed ${res.status}: ${JSON.stringify(json)}`);
  const st = json?.status?.[0];
  if (st !== "OK" && st !== "ITEM_PENDING_REVIEW") {
    throw new Error(`Unexpected publish status: ${st}`);
  }
  return json;
}

async function main() {
  if (!CWS_EXTENSION_ID || !CWS_CLIENT_ID || !CWS_CLIENT_SECRET || !CWS_REFRESH_TOKEN) {
    throw new Error("Missing CWS_* environment vars");
  }
  const token = await getAccessToken();
  const zip = await findChromeZip();
  console.log(`Uploading ${zip} to CWS…`);
  await uploadZip(token, zip);
  console.log("Upload complete. Publishing…");
  const res = await publish(token);
  console.log("Publish response:", res);
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exitCode = 1;
});

