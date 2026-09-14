import { expect, test } from "@playwright/test";

// Прогоняется отдельно против docker-compose стенда:
// npm run docker:smoke  (поднимет стенд, прогонит smoke-проверку и потушит его)
// или вручную: docker compose up -d --build && npm run test:e2e:docker

test("приложение открывается через Nginx и показывает дерево орг-структуры", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("org-tree")).toBeVisible();

  const nodes = page.getByTestId("org-tree-node");
  await expect(nodes.first()).toBeVisible();
  expect(await nodes.count()).toBeGreaterThan(0);
});

test("/api/org-tree доступен через Nginx-проксирование", async ({ request }) => {
  const response = await request.get("/api/org-tree");
  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as unknown[];
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThanOrEqual(40);
});
