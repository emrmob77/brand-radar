import test from "node:test";
import assert from "node:assert/strict";
import { deriveMentionRisk, mergeUniqueById } from "../../src/lib/mentions/realtime.ts";

test("deriveMentionRisk maps sentiment and score to risk level", () => {
  assert.equal(deriveMentionRisk({ sentiment: "negative", sentimentScore: -0.8 }), "critical");
  assert.equal(deriveMentionRisk({ sentiment: "negative", sentimentScore: -0.4 }), "high");
  assert.equal(deriveMentionRisk({ sentiment: "neutral", sentimentScore: 0.1 }), "medium");
  assert.equal(deriveMentionRisk({ sentiment: "positive", sentimentScore: 0.8 }), "low");
});

test("mergeUniqueById preserves first seen item and removes duplicates", () => {
  const merged = mergeUniqueById([
    { id: "1", value: "a" },
    { id: "2", value: "b" },
    { id: "1", value: "c" }
  ]);

  assert.deepEqual(merged, [
    { id: "1", value: "a" },
    { id: "2", value: "b" }
  ]);
});
