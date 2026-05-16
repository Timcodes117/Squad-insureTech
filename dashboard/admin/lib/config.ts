// Default to the live Render deploy. Override in dev by setting
// NEXT_PUBLIC_API_BASE_URL in a .env.local file.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://betahealth-api.onrender.com/api/v1";
