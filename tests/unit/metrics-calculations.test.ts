import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSparkline,
  calculateAISoV,
  calculateEstimatedTrafficValue,
  calculateSentimentHealth,
  percentageChange,
  signedInteger,
  signedNumber
} from "../../src/lib/metrics/calculations.ts";

test("calculateAISoV computes percentage safely", () => {
  assert.equal(calculateAISoV(20, 100), 20);
  assert.equal(calculateAISoV(0, 0), 0);
});

test("calculateSentimentHealth normalizes -1..1 into 0..100", () => {
  assert.equal(calculateSentimentHealth([1, 1, 1]), 100);
  assert.equal(calculateSentimentHealth([-1, -1]), 0);
  assert.equal(calculateSentimentHealth([0, null]), 50);
});

test("calculateEstimatedTrafficValue counts only authority >= 70", () => {
  assert.equal(calculateEstimatedTrafficValue([90, 71, 69, null]), 10);
});

test("percentage and signed helpers format values", () => {
  assert.equal(percentageChange(120, 100), 20);
  assert.equal(percentageChange(10, 0), 100);
  assert.equal(signedNumber(1.236, 1), "+1.2");
  assert.equal(signedInteger(-3.2), "-3");
});

test("buildSparkline returns four-point progression", () => {
  const sparkline = buildSparkline(80, 20);
  assert.equal(sparkline.length, 4);
  assert.equal(sparkline[0], 20);
  assert.equal(sparkline[3], 80);
});
