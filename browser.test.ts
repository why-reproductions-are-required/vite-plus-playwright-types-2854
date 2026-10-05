import { test } from "vite-plus/test";
import { cdp } from "vite-plus/test/browser";
import "vite-plus/test/browser-playwright";

test("CDP types", async () => {
  await cdp().send("Browser.getVersion");
});
