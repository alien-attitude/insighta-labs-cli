import axios  from "axios";
import chalk  from "chalk";
import { readCredentials, writeCredentials, clearCredentials } from "./credentials.js";

const BASE_URL = process.env.INSIGHTA_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "X-API-Version": "1" },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const creds = readCredentials();
  if (creds?.access_token) {
    config.headers["Authorization"] = `Bearer ${creds.access_token}`;
  }
  return config;
});

// Auto-refresh on 401 — token expired
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const creds = readCredentials();
      if (!creds?.refresh_token) {
        console.error(chalk.red("\n✗ Session expired. Please run: insighta login\n"));
        process.exit(1);
      }

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: creds.refresh_token },
          { headers: { "Content-Type": "application/json" } }
        );

        writeCredentials({
          ...creds,
          access_token:  data.access_token,
          refresh_token: data.refresh_token,
        });

        original.headers["Authorization"] = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        clearCredentials();
        console.error(chalk.red("\n✗ Session expired. Please run: insighta login\n"));
        process.exit(1);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
export { BASE_URL };
