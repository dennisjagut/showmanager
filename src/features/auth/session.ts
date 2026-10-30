// Name of the cookie with the session token. The token comes from the API (POST /api/v1/auth/login), which also checks it.
export const AUTH_COOKIE = "showmanager_auth";

// As long as the API keeps a session (SESSION_DAYS in backend/auth/service.py)
export const SESSION_DAYS = 90;
