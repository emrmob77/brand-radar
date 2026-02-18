import { createHash, randomBytes } from "crypto";

export function createPlainApiKey() {
  return `brk_${randomBytes(24).toString("hex")}`;
}

export function apiKeyPrefix(key: string) {
  return key.slice(0, 12);
}

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}
