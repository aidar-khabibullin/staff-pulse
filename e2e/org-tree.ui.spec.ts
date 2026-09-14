import { expect, test } from "@playwright/test";

test("приложение загружается и отображает данные орг-структуры после запроса к API", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("org-tree")).toBeVisible();

  const nodes = page.getByTestId("org-tree-node");
  await expect(nodes.first()).toBeVisible();
  expect(await nodes.count()).toBeGreaterThan(0);
});

test("второй уровень дерева открыт по умолчанию, клик по узлу раскрывает и скрывает потомков", async ({
  page,
}) => {
  await page.goto("/");

  const rootNode = page.getByTestId("org-tree-node").first();
  await expect(rootNode).toBeVisible();

  const rootToggle = rootNode.locator("> div").getByTestId("org-tree-toggle");
  await expect(rootToggle).toHaveAttribute("aria-expanded", "true");

  const secondLevelNode = rootNode.locator(`[data-testid="org-tree-node"]`).first();
  await expect(secondLevelNode).toBeVisible();

  const secondLevelToggle = secondLevelNode
    .locator("> div")
    .getByTestId("org-tree-toggle");

  const hasThirdLevel = (await secondLevelToggle.count()) > 0;
  test.skip(!hasThirdLevel, "первый узел второго уровня без потомков в этой генерации данных");

  await expect(secondLevelToggle).toHaveAttribute("aria-expanded", "false");

  const thirdLevelNode = secondLevelNode.locator(`[data-testid="org-tree-node"]`).first();
  await expect(thirdLevelNode).toBeHidden();

  await secondLevelToggle.click();
  await expect(thirdLevelNode).toBeVisible();

  await secondLevelToggle.click();
  await expect(thirdLevelNode).toBeHidden();
});
