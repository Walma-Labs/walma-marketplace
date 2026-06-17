# Onboarding to the Walma AI Hub (Claude Code)

This points Claude Code at Walma's AI Hub and registers your workspace, so the
team gets reliable repo attribution. ~2 minutes, **no admin rights**.

## You'll need

- **Claude Code**, a recent version (`claude --version`).
- **Node.js + git** on your PATH (you already have these if you code).
- Your **AI Hub base URL + API key** — Martin will send you both.

The marketplace is public, so there's nothing to request access to.

## 1. Point Claude Code at the AI Hub

In your terminal, set these two variables. For just this session, paste them in your
shell; to keep them, add the lines to `~/.zshrc` (macOS default) and open a new terminal:

```bash
export ANTHROPIC_BASE_URL="<AI Hub base URL — from Martin>"
export ANTHROPIC_API_KEY="<your AI Hub key — from Martin>"
```

That's all the config — there's no `settings.json` to edit.

## 2. Start a session

Run `claude` and send any message (e.g. "hi"). Because your workspace isn't registered
yet, Claude will let you know and offer to set up the AI Hub client plugin.

## 3. Install the plugin when prompted

```
/plugin marketplace add Walma-Labs/walma-marketplace
/plugin install walma-repo-context@walma
```

Approve the plugin when Claude Code asks. It installs into your home directory
(`~/.claude`) — no admin needed.

## 4. Done — you're registered

On your **next tool action** (any command or file edit), the plugin reports the repo
you're working in to the AI Hub, and the setup prompt stops appearing. Nothing else
to do.

## What to expect / FAQ

- **Is anything sensitive sent?** No. Only the git remote of the repo you're in (e.g.
  `your-org/your-repo`) plus the branch — **never** file contents, your code, command
  output, or anything you type. Outside a git repo, it sends nothing.
- **The wording of the setup prompt varies** — Claude phrases it itself; that's normal.
  It asks at most once in a while, not every message.
- **`/plugin marketplace add` fails?** The marketplace is public, so this is usually a
  stale Claude Code or a network/proxy issue — update with `claude --version`, retry, and
  confirm you can open <https://github.com/Walma-Labs/walma-marketplace>.
- **Want to watch it work?** Start with `WALMA_HOOK_DEBUG=1` set and run `claude --debug`;
  the hook prints what it posted to stderr.
- **Remove it later:** `/plugin uninstall walma-repo-context@walma`.
