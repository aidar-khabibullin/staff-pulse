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

test('клик по строке таблицы на узкой ширине переключает вид на дерево и скроллит к узлу', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('org-tree').waitFor()

  await page.getByTestId('view-toggle-table').click()
  const targetRow = page.getByTestId('org-table-row').nth(20)
  const targetNodeId = await targetRow.getAttribute('data-node-id')
  await targetRow.click()
  await expect(targetRow).toHaveAttribute('data-selected', 'true')

  // Выбор строки на узкой ширине сам переключает вид на "Дерево" — иначе результат
  // (раскрытие/скролл к узлу) остаётся не виден, пока пользователь не переключит вкладку
  // вручную. scrollIntoView на скрытом (display: none) узле браузер игнорирует, поэтому
  // важно, что переключение вида происходит автоматически, а не по ручному клику.
  await expect(page.getByTestId('view-toggle-tree')).toHaveAttribute('aria-pressed', 'true')
  const targetTreeNode = page.locator(`[data-testid="org-tree-node"][data-node-id="${targetNodeId}"]`)
  await expect(targetTreeNode).toBeVisible()

  const isInViewport = await targetTreeNode.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    return rect.top >= 0 && rect.bottom <= window.innerHeight
  })
  expect(isInViewport).toBe(true)
})
