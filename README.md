# Walma marketplace

By [Walma](https://walma.ai).

The Walma AI Hub plugin marketplace — a catalog of Claude Code plugins (and,
later, skills) distributed to AI Hub users. Add it once, then install any plugin
from it:

```
/plugin marketplace add Walma-Labs/walma-marketplace
/plugin install walma-repo-context@walma
```

(`@walma` is this marketplace's name; `walma-repo-context` is the plugin.)

## Plugins

| Plugin | What it does |
|---|---|
| [`walma-repo-context`](plugins/walma-repo-context/) | Reports the org-qualified git remote of each Claude Code session to the AI Hub (`/signals`), for reliable repo attribution + policy. Fire-and-forget; no admin. |

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
  (GitHub `owner/repo` shorthand). The repo is public, so no GitHub access grant is
  needed — anyone with the AI Hub URL + key can add it.
- **Self-onboarding nudge:** the AI Hub relay points its onboarding nudge at this
  marketplace (`GATEWAY_ONBOARDING_MARKETPLACE_URL=Walma-Labs/walma-marketplace`,
  `GATEWAY_ONBOARDING_PLUGIN=walma-repo-context@walma`) so it can walk an un-instrumented
  user through these two commands in-conversation.
- **Future:** serve `marketplace.json` dynamically from the AI Hub endpoint, per-user
  and tier-gated — same catalog shape, personalized.

## Validate

```
claude plugin validate .
```

## License

[Apache-2.0](LICENSE) © [Walma Labs](https://walma.ai). See [NOTICE](NOTICE).
