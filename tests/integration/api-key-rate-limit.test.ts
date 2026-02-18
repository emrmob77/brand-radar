import test from "node:test";
import assert from "node:assert/strict";
import { apiKeyPrefix, createPlainApiKey, hashApiKey } from "../../src/lib/api/api-key.ts";
import { consumeRateLimit } from "../../src/lib/api/rate-limit.ts";

test("api key helper generates and hashes stable values", () => {
  const key = createPlainApiKey();
  assert.equal(key.startsWith("brk_"), true);
  assert.equal(apiKeyPrefix(key).length, 12);
  assert.equal(hashApiKey(key), hashApiKey(key));
});

test("rate limit consumes quota and eventually blocks", () => {
  const identifier = `test-key-${Date.now()}`;
  let blocked = false;
  for (let index = 0; index < 120; index += 1) {
    const result = consumeRateLimit(identifier);
    if (!result.allowed) {
      blocked = true;
      assert.equal(result.remaining, 0);
      assert.equal(result.retryAfterSeconds > 0, true);
      break;
    }
  }
  assert.equal(blocked, true);
});
