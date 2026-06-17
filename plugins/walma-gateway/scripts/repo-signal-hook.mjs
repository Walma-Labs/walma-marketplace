#!/usr/bin/env node
// Walma AI Hub client — PreToolUse signal hook (cross-platform: macOS, Linux,
// Windows). Reads the hook's stdin payload, derives the ORG-QUALIFIED git remote
// for the session's working directory, and POSTs a generic /signals envelope to the
// AI Hub, keyed by the same subscription key the CLI already uses to reach it.
//
// Registered (hooks/hooks.json) with `async: true`, so Claude Code runs it WITHOUT
// blocking the tool call — fire-and-forget. It also ALWAYS exits 0 and never emits a
// permission decision, so it can never block or deny a tool. A short network timeout
// keeps it from lingering if the AI Hub is slow.
//
// Config (read from the environment the CLI already has set; no local files needed):
//   ANTHROPIC_BASE_URL  -> the AI Hub base; /signals is derived from it
//   ANTHROPIC_API_KEY   -> the subscription key (sent as x-api-key)
//   WALMA_SIGNALS_URL   -> optional explicit override for the signals endpoint
//   WALMA_GATEWAY_KEY   -> optional explicit override for the key (else ANTHROPIC_API_KEY)
//   WALMA_HOOK_DEBUG=1  -> print what it did to stderr (shows in `claude --debug`)

import { execFile } from "node:child_process";

const HOOK_VERSION = "0.1.0";
const DEBUG = process.env.WALMA_HOOK_DEBUG === "1";
const log = (...a) => { if (DEBUG) console.error("[walma-hook]", ...a); };

main();

async function main() {
  try {
    const payload = await readStdinJson();
    const cwd = payload?.cwd;
    const sessionId = payload?.session_id;
    if (!cwd) return done(0);

    // Ground truth lives in .git/config — read it fresh every tool call so a
    // mid-session cd into another repo is caught on the very next call.
    const remote = await git(cwd, ["remote", "get-url", "origin"]);
    if (!remote) { log("no git origin for", cwd); return done(0); } // not a repo / no origin → silent
    const branch = await git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]);

    const signalsUrl = resolveSignalsUrl();
    const apiKey = process.env.WALMA_GATEWAY_KEY || process.env.ANTHROPIC_API_KEY;
    if (!signalsUrl || !apiKey) { log("not configured (signalsUrl/apiKey missing)"); return done(0); }

    const envelope = {
      type: "repo",
      session_id: sessionId,
      ts: new Date().toISOString(),
      hook_version: HOOK_VERSION,
      payload: { remote_url: remote, repo: repoSlug(remote), branch: branch || null },
    };

    await post(signalsUrl, apiKey, envelope);
    log("posted", JSON.stringify(envelope), "->", signalsUrl);
  } catch (err) {
    log("error (ignored):", err && err.message ? err.message : String(err));
  }
  done(0);
}

// Derive the signals endpoint from ANTHROPIC_BASE_URL (e.g.
// https://hub.<env>.walma.ai/anthropic -> https://hub.<env>.walma.ai/anthropic/signals),
// unless WALMA_SIGNALS_URL is set explicitly.
function resolveSignalsUrl() {
  if (process.env.WALMA_SIGNALS_URL) return process.env.WALMA_SIGNALS_URL;
  const base = process.env.ANTHROPIC_BASE_URL;
  if (!base) return null;
  return base.replace(/\/+$/, "") + "/signals";
}

// owner/repo from common host remotes (https or ssh). The remote_url is always sent
// regardless; the slug is a convenience for the dashboard.
function repoSlug(remote) {
  const m = String(remote).match(
    /(?:github\.com|gitlab\.com|bitbucket\.org|dev\.azure\.com)[:/]+([^/]+\/[^/\s]+?)(?:\.git)?\/?$/i,
  );
  return m ? m[1] : null;
}

function git(cwd, args) {
  return new Promise((resolve) => {
    execFile("git", ["-C", cwd, ...args], { timeout: 4000, windowsHide: true }, (err, stdout) => {
      if (err) return resolve(null);
      resolve((stdout || "").split(/\r?\n/)[0].trim() || null);
    });
  });
}

async function post(url, apiKey, body) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 5000);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
  } catch {
    // fire-and-forget: a slow/unreachable AI Hub must never surface to the user
  } finally {
    clearTimeout(timer);
  }
}

function readStdinJson() {
  return new Promise((resolve) => {
    let data = "";
    const fail = () => resolve(undefined);
    try {
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (c) => { data += c; });
      process.stdin.on("end", () => { try { resolve(JSON.parse(data)); } catch { fail(); } });
      process.stdin.on("error", fail);
      // If nothing is piped, end fires quickly; guard against a hang regardless.
      setTimeout(fail, 3000);
    } catch { fail(); }
  });
}

function done(code) {
  // Give any pending stdout/stderr a tick to flush, then exit cleanly.
  process.exitCode = code;
}
