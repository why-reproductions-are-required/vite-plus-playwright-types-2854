# Verify the Playwright peer fix

This branch checks the [preview build from `vite-plus#2865`](https://github.com/voidzero-dev/vite-plus/pull/2865#issuecomment-5994947189) against the reproduction for [issue #2854](https://github.com/voidzero-dev/vite-plus/issues/2854). The [main branch](https://github.com/why-reproductions-are-required/vite-plus-playwright-types-2854/tree/main) keeps the original `vite-plus@1.0.0` reproduction.

`vite-plus` is pinned to `0.0.0-commit.5c6ed44f9bba729aa6d8f0df2c6c505d5b05086d`. Its dependency on `vite` selects the matching preview of `@voidzero-dev/vite-plus-core`. The browser provider uses `@vitest/browser-playwright@5.0.3`, as required by this build. Playwright remains at `1.63.0`, and TypeScript remains at `7.0.2`.

The `.npmrc` file selects the preview registry. The lockfile pins the dependency graph, and the release-age exceptions apply only to this exact preview version.

## Run the checks

Use Node.js `22.23.2` and pnpm `12.8.1`. Clone outside another workspace. Keep pnpm's global store outside the project, so ancestor resolution cannot hide the missing peer. No browser download or browser execution is needed.

```sh
git clone --branch verify-preview-2865 https://github.com/why-reproductions-are-required/vite-plus-playwright-types-2854.git
cd vite-plus-playwright-types-2854
pnpm install --frozen-lockfile
pnpm check
pnpm typecheck
pnpm check:cdp
```

If pnpm `12.8.1` is not installed, replace `pnpm` with `npx --yes pnpm@12.8.1` in these commands.

The source files are unchanged. `vite.config.ts` still contains the deliberately invalid `reducedMotion: "bogus"`, and `browser.test.ts` still calls `cdp().send("Browser.getVersion")`. No `.pnpmfile.mjs` workaround is applied.

| Command | Original `1.0.0` | Preview build |
| --- | --- | --- |
| `pnpm check` | Incorrectly accepts `"bogus"` | Rejects `"bogus"` with `TS2322` |
| `pnpm typecheck` | Incorrectly accepts `"bogus"` | Rejects `"bogus"` with `TS2322` |
| `pnpm check:cdp` | Reports `no-unsafe-call` | Passes |

The preview now links Playwright into the Vite+ dependency slot. Both option checks report:

```text
TS2322: Type '"bogus"' is not assignable to type '"no-preference" | "reduce" | null | undefined'.
```

These results were observed locally on macOS arm64 with Node.js `22.23.2` on 2026-10-05.

## GitHub Actions

The [workflow](.github/workflows/reproduce.yml) runs each command directly in a separate Ubuntu and macOS job. It uses no assertions or exit-code overrides. The `check:cdp` jobs should pass. The `check` and `typecheck` jobs should fail with `TS2322`, because the invalid option remains in the reproduction. The overall run therefore stays red when the preview fixes both symptoms.

Each job installs with `--frozen-lockfile` into a fresh store outside the checkout. `PNPM_CONFIG_CI=false` preserves pnpm's global virtual store in CI.
