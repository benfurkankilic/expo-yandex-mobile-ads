# CLAUDE.md — `@benfurkankilic/expo-yandex-mobile-ads`

Project context for Claude Code (and future contributors). Read this before
making changes — the architecture decisions here are deliberate and reversing
them quietly will break user installs.

## What this is

An **Expo config plugin** that auto-configures the native iOS and Android
project files required by the [`yandex-mobile-ads`](https://www.npmjs.com/package/yandex-mobile-ads)
SDK (Yandex Mobile Ads SDK 8). It eliminates manual `Info.plist` and
`AndroidManifest.xml` edits for Expo / React Native developers.

This package does **not** ship a runtime API of its own. Users import ad
classes (`InterstitialAdLoader`, `BannerView`, etc.) directly from
`yandex-mobile-ads`. Our package only handles the prebuild-time native config.

## Architecture decisions (and why)

### Pure config plugin, no JS surface
We could have wrapped `yandex-mobile-ads` and re-exported its API to give
users a single import. We chose not to.

**Why:** Wrapping couples our release cadence to theirs — every breaking
change in `yandex-mobile-ads` would force a coordinated release. As a pure
config plugin we only break when Yandex changes their *native* config
requirements (rare, ~once per major SDK version).

### Peer dependency on `yandex-mobile-ads`, not direct dependency
Listed in `peerDependencies` so users explicitly install it themselves.

**Why:** Lets users pin the exact SDK version they want, and avoids version
drift surprises when we update.

### Scoped npm package (`@benfurkankilic/...`) instead of unscoped
The unscoped name `expo-yandex-mobile-ads` was unpublished from npm in 2024
and may carry trademark squatting risk (Yandex is a trademark).

**Why:** Scoped under `@benfurkankilic` we own the namespace cleanly and avoid
disputes. If Yandex later blesses an unscoped name, migration is a
release-time decision, not an emergency.

### Inject all 222 SKAdNetwork IDs by default (maximalist)
We don't ask users to opt into mediation partner SKAN IDs — we inject all of
them upfront.

**Why:** App Store has no penalty for extra IDs but missing IDs silently
break attribution and revenue. Plug-and-play wins over minimal config.

### Sub-plugins per platform, only registered when needed
`withYandexMobileAdsAndroid` returns the config unmodified when no
Android-specific props are set, skipping the manifest mod entirely.

**Why:** Faster prebuild, fewer files touched, smaller diff against the
generated native projects when users `git diff` after prebuild.

## Repo layout

```
expo-yandex-mobile-ads/
├── app.plugin.js                  # Expo's entry point — must be at the root
├── plugin/                         # The config plugin (TypeScript source)
│   ├── tsconfig.json               # Extends expo-module-scripts/tsconfig.plugin
│   ├── build/                      # Compiled JS (committed to npm, NOT git)
│   └── src/
│       ├── index.ts                # withYandexMobileAds + createRunOncePlugin wrapper
│       ├── types.ts                # YandexMobileAdsPluginProps (the public API)
│       ├── skAdNetworkIds.ts       # Generated from yandex-mobile-ads@N README
│       ├── withYandexMobileAdsIos.ts       # Info.plist mods
│       └── withYandexMobileAdsAndroid.ts   # AndroidManifest mods
├── example/                         # Bundled Expo app for plugin development
│   ├── app.json                    # Wires the plugin via "../app.plugin.js"
│   └── package.json                # Local file: dep on the parent package
├── package.json                    # @benfurkankilic/expo-yandex-mobile-ads metadata
├── README.md                       # Public-facing docs (EN + TR)
├── CHANGELOG.md
└── CLAUDE.md                       # This file
```

The `build/` directory is gitignored (regenerated on `npm run build`) but
included in `npm publish` via the `files` array in `package.json`. The
opposite is true for `plugin/src/` — committed to git, excluded from npm
via `.npmignore`. This keeps the published tarball minimal.

## Development workflow

```bash
# Install deps + auto-build via prepare script
npm install

# Iterate on plugin code
npm run build         # tsc -p plugin
npm run clean         # rm -rf plugin/build

# Verify against the example app
cd example
npm install
npx expo prebuild --clean

# Inspect generated config
plutil -p ios/<bundle>/Info.plist | head
cat android/app/src/main/AndroidManifest.xml
```

**Smoke testing without a full prebuild:** the iOS and Android sub-plugins
are pure functions over their respective config objects. You can `node -e`
load `app.plugin.js` and exercise the mods against synthetic config objects.
See git history for examples (commit `e11489d`).

## How to add a new mod

1. **Create a new sub-plugin file** in `plugin/src/` (e.g.
   `withYandexMobileAdsAndroidGradle.ts`). One file per platform per
   resource (Info.plist, Podfile, AndroidManifest, build.gradle). Keep them
   small and pure.

2. **Compose it from `index.ts`**, after the existing sub-plugins:

   ```ts
   config = withYandexMobileAdsIos(config, options);
   config = withYandexMobileAdsAndroid(config, options);
   config = withYourNewMod(config, options); // new
   ```

3. **Add only the props you need** to `types.ts` with full JSDoc. Avoid
   leaking implementation details — props should describe *what* the user
   wants, not *how* the plugin achieves it.

4. **Validate inputs early.** Throw with the `[expo-yandex-mobile-ads]`
   prefix and a clear message that points to the `app.json` location.

5. **Make it idempotent.** `expo prebuild --clean` will re-run mods
   repeatedly; never duplicate entries.

6. **Update CHANGELOG.md** with the new prop and link to a usage example.

## Updating the SKAdNetwork list

`plugin/src/skAdNetworkIds.ts` is generated from the official
`yandex-mobile-ads` README. Regenerate on each SDK major release:

```bash
cd /tmp && npm pack yandex-mobile-ads@<new-version>
tar -xzf yandex-mobile-ads-*.tgz
grep -oE '[a-z0-9]+\.skadnetwork' package/README.md | awk '!seen[$0]++' > /tmp/skan_ids.txt
# Then format as a TypeScript const and replace the file contents.
```

Bump the file's header comment with the source SDK version.

## Release checklist

1. `npm run lint && npm run build && npm test` — all green
2. Verify against `example/`: `cd example && npm i && npx expo prebuild --clean`
3. Update `CHANGELOG.md` (semver: bug fix → patch, new prop → minor,
   breaking prop change → major)
4. `git tag v<version> && git push --tags`
5. `npm publish --access public`
6. Update README install snippet if version pin changed

## Style

- TypeScript strict mode, no `any` (use `unknown` + narrow at boundaries)
- JSDoc on every exported symbol — this is a library, comments are docs
- `[expo-yandex-mobile-ads]` prefix on all thrown errors
- Pure helper functions for the actual transformation logic; keep
  `withXxx` functions thin (only register the mod, defer logic to helpers
  that can be unit-tested without the prebuild pipeline)
- Use `expo/config-plugins` (re-exports from `@expo/config-plugins`) — not
  the `@expo/config-plugins` package directly, to inherit the user's Expo
  version
