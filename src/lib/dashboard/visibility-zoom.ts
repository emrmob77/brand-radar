export function selectVisibleTrendData<T>(rows: T[], zoomLevel: 1 | 2 | 3) {
  if (rows.length === 0) {
    return rows;
  }

  const sliceSize = Math.max(8, Math.ceil(rows.length / zoomLevel));
  return rows.slice(-sliceSize);
}
