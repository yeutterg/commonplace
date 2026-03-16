import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const rootDir = process.cwd();

const apiEnv = {
  PORT: "4000",
  VAULT_DIR: path.join(rootDir, "apps/web/content"),
  STATE_DIR: path.join(rootDir, "data"),
  PUBLIC_API_BASE_URL: "http://localhost:4000",
  CORS_ORIGIN: "http://localhost:3000",
  SESSION_SECRET: "playwright-local-secret-1234567890-abcdefghijklmnopqrstuvwxyz",
  SESSION_MAX_AGE_DAYS: "30",
  COOKIE_SAME_SITE: "lax",
};

const webEnv = {
  API_BASE_URL: "http://localhost:4000",
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev -w @commonplace/api",
      port: 4000,
      reuseExistingServer: false,
      timeout: 120000,
      env: apiEnv,
    },
    {
      command: "npm run dev -w @commonplace/web",
      port: 3000,
      reuseExistingServer: false,
      timeout: 120000,
      env: webEnv,
    },
  ],
});
