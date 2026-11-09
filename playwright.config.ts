import { defineConfig, devices } from '@playwright/test';

const base = process.env.BASE_PATH ?? '/MySuccessDoctor/';
// En local (environnement Claude Code), un Chromium est préinstallé à cet emplacement.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:4173${base}`,
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: `http://localhost:4173${base}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'bureau', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
