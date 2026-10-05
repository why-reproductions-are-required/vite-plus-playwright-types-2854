import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = realpathSync(fileURLToPath(new URL(".", import.meta.url)));
process.chdir(projectRoot);
assert.ok(
  process.argv.slice(2).every((arg) => arg === "--workaround"),
  "Usage: node reproduce.mjs [--workaround]",
);
const fixed = process.argv.includes("--workaround");
const vitePlus = realpathSync("node_modules/vite-plus");
const slot = dirname(vitePlus);
const linked = existsSync(join(slot, "playwright"));

console.log(`Mode: ${fixed ? "optional-peer workaround" : "original bug"}`);
console.log(`Node.js: ${process.version}`);
console.log(`Vite+ dependency slot: ${slot}`);
console.log(`Playwright linked in that slot: ${linked}`);
assert.ok(
  !slot.startsWith(projectRoot + sep),
  "The pnpm store must be outside this project, or ancestor resolution hides the bug.",
);
assert.equal(linked, fixed, "Unexpected dependency layout; follow the README installation steps.");

const declarations = readFileSync(join(vitePlus, "dist/test/browser-playwright.d.ts"), "utf8");
assert.match(declarations, /from ['"]playwright['"]/);

function check(label, bin, args, expectedStatus, expectedDiagnostic) {
  console.log(`\n> ${label}`);
  const result = spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    timeout: 60_000,
    env: { ...process.env, NO_COLOR: "1" },
  });
  if (result.error) throw result.error;
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  process.stdout.write(output);
  console.log(`Exit code: ${result.status}`);
  assert.equal(result.status, expectedStatus, `Unexpected exit code from ${label}`);
  if (expectedDiagnostic) assert.match(output, expectedDiagnostic);
}

const vp = join(vitePlus, "bin/vp");
check(
  "vp check vite.config.ts",
  vp,
  ["check", "vite.config.ts"],
  fixed ? 1 : 0,
  fixed ? /TS2322[^\n]*bogus/ : undefined,
);
check(
  "vp lint browser.test.ts --type-aware",
  vp,
  ["lint", "browser.test.ts", "--type-aware"],
  fixed ? 0 : 1,
  fixed ? undefined : /no-unsafe-call[^\n]*error/,
);
check(
  "tsc --noEmit",
  join(realpathSync("node_modules/typescript"), "bin/tsc"),
  ["--noEmit"],
  fixed ? 1 : 0,
  fixed ? /TS2322[^\n]*bogus/ : undefined,
);

console.log(
  fixed
    ? "\nVerified: the optional peer restores both option validation and CDP types."
    : "\nReproduced: invalid options pass, while a valid CDP call fails lint.",
);
