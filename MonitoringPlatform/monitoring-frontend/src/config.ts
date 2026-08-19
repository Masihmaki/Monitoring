export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Agent posts every 30s; treat the host as down after two missed intervals. */
export const AGENT_STALE_MS = 60_000;

/** Alerts older than this are history, not currently firing. */
export const ACTIVE_ALERT_MS = 10 * 60 * 1000;
