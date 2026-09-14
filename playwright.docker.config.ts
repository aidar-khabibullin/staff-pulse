import { defineConfig } from "@playwright/test";

// Отдельный конфиг для прогона против уже поднятого docker-compose стенда
// (npm run docker:smoke или `docker compose up -d --build` вручную).
// В отличие от playwright.config.ts не управляет webServer'ами — ожидает,
// что Nginx (клиент) и сервер уже запущены в контейнерах.

const DOCKER_BASE_URL = process.env.DOCKER_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e/docker-stand",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never", outputFolder: "playwright-report-docker" }]],
  use: {
    baseURL: DOCKER_BASE_URL,
    trace: "on-first-retry",
  },
});
