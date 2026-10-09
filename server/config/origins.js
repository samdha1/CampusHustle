// Allowed website origins. CLIENT_ORIGIN may hold several, comma-separated.
// On Render, RENDER_EXTERNAL_URL (the service's own https URL) is used if CLIENT_ORIGIN is not set.
const raw = process.env.CLIENT_ORIGIN || process.env.RENDER_EXTERNAL_URL || "";

module.exports = raw
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
