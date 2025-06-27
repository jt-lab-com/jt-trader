export function roundTimeByTimeframe(timestamp: number, timeframeMinutes: number): number {
  timeframeMinutes = timeframeMinutes * 60 * 1000;
  return Math.floor(timestamp / timeframeMinutes) * timeframeMinutes;
}
