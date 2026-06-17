# Walma marketplace

The Walma AI gateway plugin marketplace — a catalog of Claude Code plugins (and,
later, skills) distributed to gateway users. Add it once, then install any plugin
from it:

```
/plugin marketplace add Walma-Labs/walma-marketplace
/plugin install walma-gateway@walma
```

(`@walma` is this marketplace's name; `walma-gateway` is the plugin.)

## Plugins

| Plugin | What it does |
|---|---|
| [`walma-gateway`](plugins/walma-gateway/) | Reports the org-qualified git remote of each Claude Code session to the gateway (`/signals`), for reliable repo attribution + policy. Fire-and-forget; no admin. |

## Layout (how to add a plugin)

```
.claude-plugin/marketplace.json   the catalog (metadata.pluginRoot = ./plugins)
plugins/<name>/                    one self-contained plugin per dir
  .claude-plugin/plugin.json
  ...
```

To add a plugin: drop a new `plugins/<name>/` directory (with its own
`.claude-plugin/plugin.json`) and add one entry to `marketplace.json`'s `plugins`
array — `{ "name": "<name>", "source": "./plugins/<name>" }`. Nothing else changes;
existing installs are unaffected.

## How it's distributed

- **Direct (today):** users `/plugin marketplace add Walma-Labs/walma-marketplace`
  (GitHub `owner/repo` shorthand; Claude Code uses the user's git credentials, so a
  private Walma repo works for Walma devs).
- **Self-onboarding nudge:** the gateway relay points its onboarding nudge at this
  marketplace (`GATEWAY_ONBOARDING_MARKETPLACE_URL=Walma-Labs/walma-marketplace`,
  `GATEWAY_ONBOARDING_PLUGIN=walma-gateway@walma`) so it can walk an un-instrumented
  user through these two commands in-conversation.
- **Future:** serve `marketplace.json` dynamically from the gateway endpoint, per-user
  and tier-gated — same catalog shape, personalized.

## Validate

```
claude plugin validate .
```
