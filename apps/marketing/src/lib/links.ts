// the app runs on its own host, so the landing page only needs one base url.
// dev default matches the web workspace port, production sets VITE_APP_URL.
const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173';

export const SIGNUP_URL = `${APP_URL}/signup`;
export const LOGIN_URL = `${APP_URL}/login`;
