# Verify the Playwright peer fix

This branch uses the [preview build from `vite-plus#2865`](https://github.com/voidzero-dev/vite-plus/pull/2865#issuecomment-5994947189) to check the fix for [issue #2854](https://github.com/voidzero-dev/vite-plus/issues/2854). The [main branch](https://github.com/why-reproductions-are-required/vite-plus-playwright-types-2854/tree/main) keeps the original `vite-plus@1.0.0` reproduction.

The preview is pinned to commit `5c6ed44f9bba729aa6d8f0df2c6c505d5b05086d`. Its Vite core dependency uses the same preview. The browser provider uses `@vitest/browser-playwright@5.0.3` to match the preview's peer requirement. Playwright remains at `1.63.0`, and TypeScript remains at `7.0.2`.

## Run

Use Node.js `22.23.2` and pnpm `12.8.1`. Clone outside another workspace. Keep pnpm's global store outside the project, so ancestor resolution cannot hide the missing peer. No browser download or execution is needed.

```sh
git clone --branch verify-preview-2865 https://github.com/why-reproductions-are-required/vite-plus-playwright-types-2854.git
cd vite-plus-playwright-types-2854
pnpm install --frozen-lockfile
pnpm check
pnpm typecheck
```

Both commands should pass. The configuration uses the valid `reducedMotion: "reduce"` option. The browser test keeps the original `cdp().send("Browser.getVersion")` call, which failed lint before the fix.

To check invalid option handling manually, change `"reduce"` to `"bogus"`. Both commands should then report `TS2322`. The [earlier preview run](https://github.com/why-reproductions-are-required/vite-plus-playwright-types-2854/actions/runs/37314942960) demonstrates that rejection on Ubuntu and macOS.

## GitHub Actions

The [workflow](.github/workflows/reproduce.yml) runs both commands directly on Ubuntu and macOS, without assertion wrappers or a workaround hook. Each job installs from the lockfile into a fresh store outside the checkout. `PNPM_CONFIG_CI=false` preserves pnpm's global virtual store in CI.

The `.npmrc` file selects the preview registry. Release-age exceptions apply only to the exact preview version.
