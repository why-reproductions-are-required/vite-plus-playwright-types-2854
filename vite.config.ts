import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

export default defineConfig({
  lint: {
    options: { typeAware: true, typeCheck: true },
    rules: { "typescript/no-unsafe-call": "error" },
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright({ contextOptions: { reducedMotion: "bogus" } }),
      instances: [{ browser: "chromium" }],
    },
  },
});
