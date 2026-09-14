import { expect, test } from "@playwright/test";

interface OrgNode {
  id: string;
  name: string;
  parentId: string | null;
  headcount: number;
  budget: number;
  performance: number;
  updatedAt: string;
}

async function fetchNodes(request: import("@playwright/test").APIRequestContext): Promise<OrgNode[]> {
  const response = await request.get("http://localhost:4000/api/org-tree");
  return (await response.json()) as OrgNode[];
}

async function showTable(page: import("@playwright/test").Page) {
  await page.goto("/");
  const toggle = page.getByTestId("view-toggle-table");
  if (await toggle.isVisible()) {
    await toggle.click();
  }
}

async function showTree(page: import("@playwright/test").Page) {
  const toggle = page.getByTestId("view-toggle-tree");
  if (await toggle.isVisible()) {
    await toggle.click();
  }
}

test("AI-поиск по уровню применяет структурированный фильтр к дереву и таблице", async ({
  page,
  request,
}) => {
  // parentId/иерархия не меняются live-обновлениями (патчатся только headcount/budget/performance),
  // поэтому фильтр по уровню (в отличие от фильтра по метрике) стабилен для сравнения.
  const nodes = await fetchNodes(request);
  const divisions = nodes.filter((node) => node.parentId === null);
  const expectedIds = new Set(divisions.map((node) => node.id));

  await showTable(page);

  await page.getByTestId("ai-search-input").fill("уровень 1");
  await expect(page.getByTestId("ai-search-mode")).toHaveText("AI-фильтр применён");

  const rows = page.getByTestId("org-table-row");
  await expect(rows).toHaveCount(expectedIds.size);

  const rowIds = await rows.evaluateAll((els) => els.map((el) => el.getAttribute("data-node-id")));
  for (const id of rowIds) {
    expect(expectedIds.has(id!)).toBe(true);
  }

  await showTree(page);
  const treeNodes = page.getByTestId("org-tree-node");
  await expect(treeNodes).toHaveCount(expectedIds.size);
});

test("нераспознанный запрос AI-поиска падает в текстовый fallback-поиск", async ({ page, request }) => {
  const nodes = await fetchNodes(request);
  const target = nodes[Math.floor(nodes.length / 2)];
  const query = target.name.slice(0, Math.max(2, Math.floor(target.name.length / 2)));

  await showTable(page);

  await page.getByTestId("ai-search-input").fill(query);

  await expect(page.getByTestId("ai-search-mode")).toHaveText(
    "Запрос не распознан — используется текстовый поиск",
  );

  const rows = page.getByTestId("org-table-row");
  await expect(async () => {
    const names = await rows.locator("td").first().allTextContents();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.toLowerCase()).toContain(query.toLowerCase());
    }
  }).toPass();
});
