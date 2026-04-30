#!/usr/bin/env node
import http    from "http";
import { createServer } from "http";
import chalk   from "chalk";
import ora     from "ora";
import open    from "open";
import axios   from "axios";
import { generatePkce, generateState } from "../utils/pkce.js";
import { readCredentials, writeCredentials, clearCredentials } from "../utils/credentials.js";
import api, { BASE_URL } from "../utils/api.js";
import { printSuccess, printError, printInfo } from "../utils/display.js";

const CLI_CALLBACK_PORT = 9876;
const CLI_REDIRECT_URI  = `http://localhost:${CLI_CALLBACK_PORT}/callback`;

/**
 * insighta login
 * Full PKCE OAuth flow: opens browser, captures callback, exchanges for tokens
 */
export async function loginCommand() {
  const existing = readCredentials();
  if (existing?.access_token) {
    printInfo(`Already logged in as @${existing.user?.username || "unknown"}. Run 'insighta logout' first.`);
    return;
  }

  const { code_verifier, code_challenge } = generatePkce();
  const state = generateState();

  const spinner = ora("Initiating GitHub OAuth...").start();

  let githubUrl;
  try {
    const { data } = await axios.get(`${BASE_URL}/auth/github/cli`, {
      params: { state, code_challenge, redirect_uri: CLI_REDIRECT_URI },
    });
    githubUrl = data.url;
    spinner.succeed("GitHub OAuth initiated");
  } catch (err) {
    spinner.fail("Failed to initiate login");
    printError(err.response?.data?.message || err.message);
    process.exit(1);
  }

  // Start local callback server
  let resolveCallback;
  const callbackPromise = new Promise((r) => (resolveCallback = r));

  const server = createServer((req, res) => {
    const url    = new URL(req.url, `http://localhost:${CLI_CALLBACK_PORT}`);
    const code   = url.searchParams.get("code");
    const cbState = url.searchParams.get("state");

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>✅ Authenticated!</h2>
        <p>You can close this tab and return to your terminal.</p>
      </body></html>
    `);

    resolveCallback({ code, state: cbState });
  });

  server.listen(CLI_CALLBACK_PORT, () => {
    console.log(chalk.cyan("\n Opening GitHub in your browser..."));
    open(githubUrl);
    console.log(chalk.gray("  Waiting for authentication...\n"));
  });

  const { code, state: returnedState } = await callbackPromise;
  server.close();

  if (returnedState !== state) {
    printError("State mismatch — possible CSRF attack. Aborting.");
    process.exit(1);
  }

  const exchangeSpinner = ora("Exchanging code for tokens...").start();

  try {
    const { data } = await axios.post(`${BASE_URL}/auth/github/exchange`, {
      code,
      code_verifier,
      state,
    });

    writeCredentials({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      user:          data.user,
    });

    exchangeSpinner.succeed(`Logged in as ${chalk.bold("@" + data.user.username)} (${data.user.role})`);
  } catch (err) {
    exchangeSpinner.fail("Token exchange failed");
    printError(err.response?.data?.message || err.message);
    process.exit(1);
  }
}

/**
 * insighta logout
 */
export async function logoutCommand() {
  const creds = readCredentials();
  if (!creds) {
    printInfo("Not logged in.");
    return;
  }

  const spinner = ora("Logging out...").start();
  try {
    await axios.post(`${BASE_URL}/auth/logout`, { refresh_token: creds.refresh_token });
  } catch { /* ok — clear locally regardless */ }

  clearCredentials();
  spinner.succeed("Logged out successfully");
}

/**
 * insighta whoami
 */
export async function whoamiCommand() {
  const creds = readCredentials();
  if (!creds) {
    printError("Not logged in. Run: insighta login");
    process.exit(1);
  }

  const spinner = ora("Fetching user info...").start();
  try {
    const { data } = await api.get("/auth/me");
    spinner.stop();
    const u = data.data;
    console.log(`
  ${chalk.bold("User:")}        @${u.username}
  ${chalk.bold("Email:")}       ${u.email || "—"}
  ${chalk.bold("Role:")}        ${chalk.cyan(u.role)}
  ${chalk.bold("Active:")}      ${u.is_active ? chalk.green("yes") : chalk.red("no")}
  ${chalk.bold("Last login:")}  ${u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "—"}
    `);
  } catch (err) {
    spinner.fail("Failed to fetch user info");
    printError(err.response?.data?.message || err.message);
    process.exit(1);
  }
}
