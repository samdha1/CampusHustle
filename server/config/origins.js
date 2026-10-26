// Allowed website origins. CLIENT_ORIGIN may hold several, comma-separated.
// On Render, RENDER_EXTERNAL_URL (the service's own https URL) is used if CLIENT_ORIGIN is not set.
const raw = process.env.CLIENT_ORIGIN || process.env.RENDER_EXTERNAL_URL || "";
const configuredOrigins = raw
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
const localOrigins =
  process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

module.exports = [...new Set([...configuredOrigins, ...localOrigins])];
