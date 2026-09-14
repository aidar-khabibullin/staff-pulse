import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 } })

test('вручную свёрнутая ветка дерева остаётся свёрнутой после live-патча', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('org-tree').waitFor()

  const firstToggle = page.getByTestId('org-tree-toggle').first()
  await expect(firstToggle).toHaveAttribute('aria-expanded', 'true')

  await firstToggle.click()
  await expect(firstToggle).toHaveAttribute('aria-expanded', 'false')

  // Live-патчи приходят раз в секунду — ждём минимум одного, чтобы убедиться,
  // что обновление дерева не перезапускает автораскрытие предков выбранного узла.
  await page.waitForTimeout(2500)
  await expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
})

test('клик по строке таблицы на узкой ширине раскрывает и скроллит к узлу в дереве после переключения вида', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('org-tree').waitFor()

  await page.getByTestId('view-toggle-table').click()
  const targetRow = page.getByTestId('org-table-row').nth(20)
  const targetNodeId = await targetRow.getAttribute('data-node-id')
  await targetRow.click()
  await expect(targetRow).toHaveAttribute('data-selected', 'true')

  // На узкой ширине дерево скрыто через CSS (display: none), пока активна "Таблица" —
  // scrollIntoView на скрытом узле браузер игнорирует, поэтому здесь проверяется
  // именно повторная попытка скролла после переключения обратно на "Дерево".
  await page.getByTestId('view-toggle-tree').click()
  const targetTreeNode = page.locator(`[data-testid="org-tree-node"][data-node-id="${targetNodeId}"]`)
  await expect(targetTreeNode).toBeVisible()

  const isInViewport = await targetTreeNode.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    return rect.top >= 0 && rect.bottom <= window.innerHeight
  })
  expect(isInViewport).toBe(true)
})
