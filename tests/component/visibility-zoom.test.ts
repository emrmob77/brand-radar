import test from "node:test";
import assert from "node:assert/strict";
import { selectVisibleTrendData } from "../../src/lib/dashboard/visibility-zoom.ts";

test("selectVisibleTrendData keeps full data on low volume", () => {
  const rows = [1, 2, 3, 4];
  assert.deepEqual(selectVisibleTrendData(rows, 1), rows);
});

test("selectVisibleTrendData slices by zoom level while keeping minimum window", () => {
  const rows = Array.from({ length: 30 }, (_, index) => index + 1);
  const zoomed = selectVisibleTrendData(rows, 3);

  assert.equal(zoomed.length >= 8, true);
  assert.equal(zoomed[zoomed.length - 1], 30);
});
