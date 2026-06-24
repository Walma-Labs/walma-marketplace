# Repo Context — Walma AI Hub client plugin

A Claude Code plugin that registers your workspace with your organization's AI
Hub. It ships one **`PreToolUse` hook** that reads the org-qualified git remote
of the current session and reports it to the AI Hub's `/signals` endpoint, keyed by
the same subscription key the CLI already uses. This gives AI Hub admins reliable
repo attribution and policy — something the AI Hub can't get from the request stream
alone (it only sees the working-directory *name*, not the org-qualified remote).

- **Fire-and-forget.** The hook is registered `async`, so Claude Code never waits on
  it; it also always exits 0 and never denies a tool call.
- **No admin rights.** Installs into `~/.claude/plugins/` like any plugin.
- **Cross-platform.** Pure Node (macOS, Linux, Windows); the only external command is
  `git`, run via `execFile` (no shell), so there's nothing OS-specific to quote.
- **Privacy.** It sends only `{ remote_url, repo (owner/repo), branch }` — never file
  contents, tool inputs, or command output. A non-git directory sends nothing.

## What it sends

On each tool call, to `POST <ai-hub>/signals` with header `x-api-key: <subscription key>`:

```json
{
  "type": "repo",
  "session_id": "<claude session id>",
  "ts": "2026-06-12T10:03:48.262Z",
  "hook_version": "0.1.0",
  "payload": { "remote_url": "https://github.com/your-org/your-repo.git", "repo": "your-org/your-repo", "branch": "main" }
}
```

When the session isn't in a git repo (e.g. Claude Code launched from a non-repo
directory), it sends a lightweight **heartbeat** instead — so the AI Hub can tell
"plugin installed & running" from "not installed", independent of repo work:

```json
{ "type": "heartbeat", "session_id": "<claude session id>", "ts": "…", "hook_version": "0.2.0", "payload": {} }
```

The envelope is deliberately generic (`type` + opaque `payload`): future signal kinds
are a new `type`, not a new endpoint or a new plugin.

## Install

```
/plugin marketplace add Walma-Labs/walma-marketplace
/plugin install walma-repo-context@walma
```

The hook reads its configuration from the environment the CLI already has:

| Variable | Purpose | Default |
|---|---|---|
| `ANTHROPIC_BASE_URL` | AI Hub base; `/signals` is derived from it | — (required unless `WALMA_SIGNALS_URL` set) |
| `ANTHROPIC_API_KEY` | subscription key, sent as `x-api-key` | — (required unless `WALMA_GATEWAY_KEY` set) |
| `WALMA_SIGNALS_URL` | explicit signals endpoint override | derived from `ANTHROPIC_BASE_URL` |
| `WALMA_GATEWAY_KEY` | explicit key override | `ANTHROPIC_API_KEY` |
| `WALMA_HOOK_DEBUG=1` | log what the hook did to stderr (`claude --debug`) | off |

If neither a signals URL nor a key is resolvable, the hook silently does nothing — so
it's safe to enable everywhere; it only acts when the AI Hub env is present.

## Distribution

This plugin lives in the [`walma` marketplace](../../) (repo root), one plugin among a
growing catalog. See that README for how the marketplace is added and served. In short:

- **For anyone:** `/plugin marketplace add Walma-Labs/walma-marketplace` then
  `/plugin install walma-repo-context@walma`. The repo is public, so no GitHub access grant is
  needed. Pin a release with `@<tag>` if you want.
- **Same-machine test:** `/plugin marketplace add <path-to-the-marketplace-root>`.
- **Self-onboarding nudge:** the relay points its nudge here via
  `GATEWAY_ONBOARDING_MARKETPLACE_URL=Walma-Labs/walma-marketplace` +
  `GATEWAY_ONBOARDING_PLUGIN=walma-repo-context@walma`, walking an un-instrumented user
  through those two commands in-conversation.

## Files

```
.claude-plugin/plugin.json   plugin manifest (points hooks -> hooks/hooks.json)
hooks/hooks.json             PreToolUse, async, exec-form: node scripts/repo-signal-hook.mjs
scripts/repo-signal-hook.mjs the hook (git remote -> /signals)
```

(The marketplace catalog lives at the repo root in `.claude-plugin/marketplace.json`,
not in this plugin dir.)

## Validate

```
claude plugin validate <path-to-the-marketplace-root>
```
