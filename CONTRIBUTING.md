# Contributing to `@benfurkankilic/expo-yandex-mobile-ads`

Thanks for your interest in contributing! This is a community Expo config plugin maintained by [Furkan Kılıç](https://github.com/benfurkankilic). All contributions go through pull request review — please read this guide before opening one.

## Before you start

- **Check existing issues + PRs.** Your bug or feature may already be tracked. Avoid duplicate work.
- **Open an issue first for non-trivial changes.** API additions, breaking changes, or anything touching native config behavior should be discussed in an issue before you write code. Small bug fixes and doc tweaks can go straight to PR.
- **Read [CLAUDE.md](./CLAUDE.md).** It captures the architecture decisions (pure config plugin, peer-dep model, scoping, dedup logic, etc.) that aren't always obvious from the code. Reversing them quietly will cause your PR to be rejected.

## Development setup

```bash
git clone https://github.com/benfurkankilic/expo-yandex-mobile-ads.git
cd expo-yandex-mobile-ads
npm install                    # builds plugin via prepare script

# Iterate on plugin source
npm run build                  # tsc -p plugin
npm run clean                  # rm -rf plugin/build

# Validate against the bundled example app
cd example
npm install
npx expo prebuild --clean      # regenerates ios/ + android/

# Inspect generated config to confirm your mod did what you expected
plutil -p ios/<bundle>/Info.plist | head
cat android/app/src/main/AndroidManifest.xml
```

For unit-level testing of plugin internals without spinning up prebuild, you can `node -e` load `app.plugin.js` and exercise mods against synthetic config objects. See git history (commit `e11489d`) for a worked example.

## Code style

- **TypeScript strict mode.** No `any` — use `unknown` and narrow at boundaries. Run `npm run build` before committing; CI will reject anything that doesn't compile clean.
- **JSDoc on every exported symbol.** This is a library — comments are public API documentation. Hovers should explain not just *what* a function does but *when* to use it and any non-obvious constraints.
- **Pure helpers for transformation logic.** Keep `withXxx` functions thin (only register the mod). Push the actual file-mutation logic into pure helpers that can be tested without the prebuild pipeline.
- **All thrown errors prefixed `[expo-yandex-mobile-ads]`.** Helps developers grep the source of errors during debugging.
- **Use `expo/config-plugins`**, not `@expo/config-plugins` directly. Inheriting the user's Expo version avoids subtle version mismatches.

## Adding a new mod

If you're adding support for a new platform configuration (e.g., a Podfile property, a Gradle setting, a new Info.plist key):

1. **Create a focused sub-plugin file** in `plugin/src/` (one file per platform per resource — e.g., `withYandexMobileAdsAndroidGradle.ts` for `build.gradle` mods).
2. **Compose it in `index.ts`** after the existing sub-plugins, in deterministic order.
3. **Add only the props you need** to `types.ts`, with full JSDoc. Props should describe *what* the user wants, not *how* the plugin achieves it.
4. **Validate inputs early** with the `[expo-yandex-mobile-ads]` prefix on any thrown errors.
5. **Make it idempotent.** `expo prebuild --clean` will re-run mods repeatedly; never duplicate entries.
6. **Update CHANGELOG.md** under the `[Unreleased]` section with the new prop and a usage snippet.

## Updating the SKAdNetwork list

`plugin/src/skAdNetworkIds.ts` is auto-generated from the official `yandex-mobile-ads@<N>` README. When Yandex ships a new SDK version with an updated SKAN list:

```bash
cd /tmp && npm pack yandex-mobile-ads@<new-version>
tar -xzf yandex-mobile-ads-*.tgz
grep -oE '[a-z0-9]+\.skadnetwork' package/README.md | awk '!seen[$0]++' > /tmp/skan_ids.txt
# Format as a TypeScript const array and replace skAdNetworkIds.ts contents.
# Bump the file's header comment with the source SDK version.
```

Submit as a PR with the SDK version bump in the commit message (e.g., `chore: regenerate SKAN list from yandex-mobile-ads@8.1`).

## Pull request process

1. **Branch off `main`.** Use a descriptive branch name: `feat/...`, `fix/...`, `chore/...`, `docs/...`.
2. **Keep PRs small and focused.** One logical change per PR. Multiple unrelated fixes in one PR slow review and increase reject risk.
3. **Write a clear PR description.** Include: what you changed, why, how to test, and any breaking-change notes.
4. **Update CHANGELOG.md** under `[Unreleased]` for any user-visible change.
5. **All PRs require review and explicit approval from [@benfurkankilic](https://github.com/benfurkankilic) before merge.** Branch protection enforces this. Don't be discouraged if review takes a few days.
6. **Be responsive to review feedback.** Small repo, single maintainer — keeping the back-and-forth tight makes review faster.

### Commit messages

Loose [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat(plugin): add support for Podfile properties`
- `fix(android): handle missing <application> tag in manifest`
- `docs: clarify mediation prop usage`
- `chore: bump expo-module-scripts to 56`

The scope (in parentheses) is optional but appreciated. Subject line under 72 chars; body wraps at 72.

## Releases

Releases are tagged and published to npm by [@benfurkankilic](https://github.com/benfurkankilic). Contributors don't need to bump versions — that happens at release time.

## Code of conduct

Be respectful. Disagree with code, not people. No harassment, no personal attacks. Issues or PRs that violate this will be closed without discussion.

## Questions?

Open a GitHub Discussion or file an issue with the `question` label.
