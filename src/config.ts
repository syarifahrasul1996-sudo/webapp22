/**
 * Central app configuration. Override any value with a Vite env var
 * (e.g. in .env.local) instead of editing source files.
 */
const env = (import.meta as any).env || {};

/** Default Google Apps Script web-app endpoint. */
export const DEFAULT_SCRIPT_URL: string =
  env.VITE_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbw5KpBvJyFpIXmsHueg4XPSRkZ0mg6kxHqjMGp3WEs8Hx_JodvKSoKEg6RMsdH54iCa/exec';

/** Default Google Sheet used when the user has not configured one. */
export const DEFAULT_SPREADSHEET_ID: string =
  env.VITE_DEFAULT_SPREADSHEET_ID || '1kUAJYUVhr9bPYErtpnohpvuGGyhBSvJyEOIyzEFivJo';

/**
 * Shared key sent with every Apps Script request. It must match the
 * API_KEY Script Property set in the Apps Script project. This keeps casual
 * visitors out; it is not a substitute for per-user auth because it ships
 * in the client bundle.
 */
export const SCRIPT_API_KEY: string = env.VITE_SCRIPT_API_KEY || '';

/** Adds the shared API key to an Apps Script request body (no-op if unset). */
export function withScriptKey<T extends Record<string, any>>(body: T): T & { key?: string } {
  return SCRIPT_API_KEY ? { ...body, key: SCRIPT_API_KEY } : body;
}
