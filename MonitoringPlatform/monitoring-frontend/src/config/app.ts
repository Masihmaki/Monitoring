export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Agent posts every 30s; treat the host as down after two missed intervals. */
export const AGENT_STALE_MS = 60_000;

/** ~3 hours of samples at a 30s agent interval. */
export const METRICS_HISTORY_LIMIT = 360;

/** Alerts older than this are history, not currently firing. */
export const ACTIVE_ALERT_MS = 10 * 60 * 1000;
