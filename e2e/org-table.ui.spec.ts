import { expect, test } from "@playwright/test";

function parseHeadcount(text: string): number {
  return Number(text.trim());
}

async function showTable(page: import("@playwright/test").Page) {
  await page.goto("/");
  const toggle = page.getByTestId("view-toggle-table");
  if (await toggle.isVisible()) {
    await toggle.click();
  }
}

test("сортировка по столбцу и двойной клик переворачивают порядок строк", async ({
  page,
}) => {
  await showTable(page);

  const header = page.getByTestId("org-table-header-headcount");
  await header.click();

  const cellsLocator = page
    .getByTestId("org-table-row")
    .locator("td")
    .nth(2);

  const ascValues = (await cellsLocator.allTextContents()).map(parseHeadcount);
  const sortedAsc = [...ascValues].sort((a, b) => a - b);
  expect(ascValues).toEqual(sortedAsc);

  await header.dblclick();

  const descValues = (await cellsLocator.allTextContents()).map(parseHeadcount);
  const sortedDesc = [...descValues].sort((a, b) => b - a);
  expect(descValues).toEqual(sortedDesc);
});

test("фильтр по названию сужает список строк таблицы", async ({ page }) => {
  await showTable(page);

  const rows = page.getByTestId("org-table-row");
  await expect(rows.first()).toBeVisible();

  const firstName = (await rows.first().locator("td").first().textContent())!.trim();
  const query = firstName.slice(0, Math.max(2, Math.floor(firstName.length / 2)));

  await page.getByTestId("org-table-filter").fill(query);

  await expect(async () => {
    const names = await rows.locator("td").first().allTextContents();
    expect(names.length).toBeGreaterThan(0);
    for (const name of await rows.allTextContents()) {
      expect(name.toLowerCase()).toContain(query.toLowerCase());
    }
  }).toPass();
});

test("клик по строке таблицы выделяет соответствующий узел в дереве", async ({
  page,
}) => {
  await showTable(page);

  const rows = page.getByTestId("org-table-row");
  await expect(rows.first()).toBeVisible();

  const targetRow = rows.nth(1);
  const nodeId = await targetRow.getAttribute("data-node-id");
  await targetRow.click();

  const treeNode = page.locator(`[data-testid="org-tree-node"][data-node-id="${nodeId}"] > div`).first();
  await expect(treeNode).toHaveAttribute("data-selected", "true");
});
