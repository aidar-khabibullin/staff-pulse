import { defineConfig } from "@playwright/test";

const SERVER_PORT = 4000;
const CLIENT_PORT = 5173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run dev --prefix server",
      port: SERVER_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    // Клиентский dev-сервер подключается начиная с Фазы 2, когда появится client/.
  ],
  projects: [
    {
      name: "api",
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: `http://localhost:${SERVER_PORT}`,
      },
    },
  ],
});
