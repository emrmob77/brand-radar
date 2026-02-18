import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCondition, severityForRule } from "../../src/lib/alerts/evaluation.ts";

test("evaluateCondition handles threshold operators", () => {
  assert.equal(evaluateCondition({ current: 10, previous: 4 }, "above", 8), true);
  assert.equal(evaluateCondition({ current: 2, previous: 4 }, "below", 3), true);
  assert.equal(evaluateCondition({ current: 4, previous: 6 }, "equals", 4), true);
});

test("evaluateCondition supports changes_by percent deltas", () => {
  assert.equal(evaluateCondition({ current: 20, previous: 10 }, "changes_by", 50), true);
  assert.equal(evaluateCondition({ current: 11, previous: 10 }, "changes_by", 20), false);
});

test("severityForRule escalates by metric and delta", () => {
  assert.equal(severityForRule({ metric: "hallucinations" }, { current: 1, previous: 0 }), "critical");
  assert.equal(severityForRule({ metric: "sentiment" }, { current: -0.2, previous: 0.1 }), "critical");
  assert.equal(severityForRule({ metric: "mentions" }, { current: 25, previous: 20 }), "warning");
  assert.equal(severityForRule({ metric: "mentions" }, { current: 11, previous: 10 }), "info");
});
