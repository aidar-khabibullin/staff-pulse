import { expect, test } from "@playwright/test";

async function showTable(page: import("@playwright/test").Page) {
  await page.goto("/");
  const toggle = page.getByTestId("view-toggle-table");
  if (await toggle.isVisible()) {
    await toggle.click();
  }
}

test("индикатор соединения переходит в состояние open", async ({ page }) => {
  await page.goto("/");

  const status = page.getByTestId("connection-status");
  await expect(status).toHaveAttribute("data-status", "open");
});

test("клавиатурная навигация по таблице: стрелки, Home/End, Enter", async ({
  page,
}) => {
  await showTable(page);

  const rows = page.getByTestId("org-table-row");
  await expect(rows.first()).toBeVisible();
  const rowCount = await rows.count();

  await rows.first().focus();
  await expect(rows.first()).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(rows.nth(1)).toBeFocused();

  await page.keyboard.press("End");
  await expect(rows.nth(rowCount - 1)).toBeFocused();

  await page.keyboard.press("Home");
  await expect(rows.first()).toBeFocused();

  const nodeId = await rows.first().getAttribute("data-node-id");
  await page.keyboard.press("Enter");

  const treeNode = page.locator(
    `[data-testid="org-tree-node"][data-node-id="${nodeId}"] > div`,
  ).first();
  await expect(treeNode).toHaveAttribute("data-selected", "true");
});
