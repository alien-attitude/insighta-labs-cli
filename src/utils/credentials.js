import fs   from "fs";
import path  from "path";
import os    from "os";

const CREDENTIALS_DIR  = path.join(os.homedir(), ".insighta");
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, "credentials.json");

export function readCredentials() {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) return null;
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export function writeCredentials(data) {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

export function clearCredentials() {
  try { fs.unlinkSync(CREDENTIALS_FILE); } catch { /* ok */ }
}

export function getAccessToken() {
  return readCredentials()?.access_token || null;
}

export function getRefreshToken() {
  return readCredentials()?.refresh_token || null;
}
