import test from "node:test";
import assert from "node:assert/strict";
import { consumeRateLimit } from "../../src/lib/api/rate-limit.ts";
import { shouldRunOnboarding } from "../../src/lib/onboarding/flow.ts";

test("first-time user should be routed to onboarding", () => {
  const result = shouldRunOnboarding({
    onboardingCompletedAt: null,
    onboardingSkippedAt: null,
    clientCount: 0
  });
  assert.equal(result, true);
});

test("completed or skipped onboarding routes user to dashboard", () => {
  assert.equal(
    shouldRunOnboarding({
      onboardingCompletedAt: new Date().toISOString(),
      onboardingSkippedAt: null,
      clientCount: 0
    }),
    false
  );

  assert.equal(
    shouldRunOnboarding({
      onboardingCompletedAt: null,
      onboardingSkippedAt: new Date().toISOString(),
      clientCount: 0
    }),
    false
  );
});

test("rate limiting is isolated per API key (multi-user simulation)", () => {
  const keyA = `qa-key-a-${Date.now()}`;
  const keyB = `qa-key-b-${Date.now()}`;

  for (let index = 0; index < 100; index += 1) {
    consumeRateLimit(keyA);
  }

  const aResult = consumeRateLimit(keyA);
  const bResult = consumeRateLimit(keyB);

  assert.equal(aResult.allowed, false);
  assert.equal(bResult.allowed, true);
});
