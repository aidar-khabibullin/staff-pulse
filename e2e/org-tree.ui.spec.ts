import { expect, test } from "@playwright/test";

test("приложение загружается и отображает данные орг-структуры после запроса к API", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("org-tree-list")).toBeVisible();

  const rows = page.getByTestId("org-tree-list").locator("li");
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThanOrEqual(40);
});
