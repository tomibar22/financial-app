// SECURITY: API secrets are NOT stored here anymore.
// They are injected server-side by the proxies (api/morning.js, api/notion.js)
// from environment variables, so they never reach the browser bundle.
// These placeholders are sent over same-origin requests and overwritten server-side.
export const NOTION_API_KEY = "managed-by-server";
export const MORNING_ID = "managed-by-server";
export const MORNING_SECRET = "managed-by-server";

// Database IDs are not secrets (useless without the API key) and stay here.
export const NOTION_DATABASE_ID = "c18b4103b7a043018c695a7929f17ac3";
export const NOTION_YEARS_DATABASE_ID = "4e6fe7f02f8d41199eb37037d3302a3e";
export const NOTION_MONTHS_DATABASE_ID = "6ba0cc96770b4afb813ec8933c08dc27";