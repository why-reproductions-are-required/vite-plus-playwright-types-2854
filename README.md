# Missing Playwright types in Vite+

Reproduction for [voidzero-dev/vite-plus#2854](https://github.com/voidzero-dev/vite-plus/issues/2854).

[![Reproduce Playwright types issue](https://github.com/why-reproductions-are-required/vite-plus-playwright-types-2854/actions/workflows/reproduce.yml/badge.svg)](https://github.com/why-reproductions-are-required/vite-plus-playwright-types-2854/actions/workflows/reproduce.yml)

`vite-plus` imports `playwright` types in its bundled browser provider declarations but does not declare that dependency or peer. With pnpm's [global virtual store](https://pnpm.io/global-virtual-store), the package cannot resolve those types, even when the project installs Playwright directly.

The project uses the reported versions: `vite-plus@1.0.0`, `@vitest/browser-playwright@5.0.1`, `playwright@1.63.0`, `typescript@7.0.2`, and `pnpm@12.8.1`. The lockfile pins the dependency graph.

## Reproduce

Use Node.js `22.23.2` and pnpm `12.8.1`. Clone outside another workspace. No browser download or browser execution is needed.

Keep pnpm's store outside the project, as it is by default. A custom store inside the project hides the bug: TypeScript can walk up from the stored package to the project's `node_modules/playwright`. The verification script rejects that layout.

```sh
git clone https://github.com/why-reproductions-are-required/vite-plus-playwright-types-2854.git
cd vite-plus-playwright-types-2854
pnpm install --frozen-lockfile
pnpm repro
```

If pnpm `12.8.1` is not installed, replace `pnpm` with `npx --yes pnpm@12.8.1` in these commands.

`pnpm repro` checks the actual dependency slot and all three outcomes below. It exits with `0` only when the bug is reproduced; an unexpected result fails the script.

| Command          | Actual result                                                  | Expected behavior                       |
| ---------------- | -------------------------------------------------------------- | --------------------------------------- |
| `pnpm check`     | Passes with `reducedMotion: "bogus"`                           | Reject the invalid option with `TS2322` |
| `pnpm check:cdp` | Reports `no-unsafe-call` on `cdp().send("Browser.getVersion")` | Accept the valid CDP call               |
| `pnpm typecheck` | Passes with `skipLibCheck: true`                               | Reject the invalid option with `TS2322` |

`pnpm check` runs `vp check vite.config.ts` to isolate the invalid option. `pnpm check:cdp` checks `browser.test.ts` separately. An unfiltered `vp check` also sees the CDP lint error.

To expose the missing import directly:

```sh
pnpm exec tsc --noEmit --skipLibCheck false
```

Among the declaration diagnostics, TypeScript reports:

```text
vite-plus/dist/test/browser-playwright.d.ts(3,134): error TS2307: Cannot find module 'playwright' or its corresponding type declarations.
```

## Verify the workaround

In a second clone, copy the supplied hook to pnpm's default hook filename and reinstall:

```sh
cp workaround.pnpmfile.mjs .pnpmfile.mjs
pnpm install --no-frozen-lockfile --force
pnpm repro:fixed
```

The hook only adds `playwright` as an optional peer of `vite-plus`. It does not change the source code or package versions. Installation updates this clone's lockfile and links Playwright into the Vite+ dependency slot.

Both `pnpm check` and `pnpm typecheck` now reject `"bogus"`:

```text
TS2322: Type '"bogus"' is not assignable to type '"no-preference" | "reduce" | null | undefined'.
```

`pnpm check:cdp` now passes. `pnpm repro:fixed` asserts these results and exits with `0` when all match.

Verified on macOS arm64 with Node.js `22.23.2` on 2026-10-05, including a fresh install into an empty store outside the project. The install also reports Vite alias peer warnings; both the baseline and workaround have those warnings.

## GitHub Actions

The [workflow](.github/workflows/reproduce.yml) runs on pushes to `main`, pull requests, and manual dispatch. Ubuntu and macOS jobs run `pnpm check`, `pnpm typecheck`, and `pnpm check:cdp` directly. The first two commands incorrectly accept `"bogus"`; the CDP lint command reports `no-unsafe-call` and fails the job. CI is expected to be red while this bug is present. It does not use assertions or apply the workaround.

Each job installs with `--frozen-lockfile` into a fresh store outside the checkout. `PNPM_CONFIG_CI=false` prevents pnpm from disabling the global virtual store in CI.
