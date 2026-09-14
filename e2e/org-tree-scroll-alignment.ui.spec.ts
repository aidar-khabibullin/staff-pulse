import { test, expect } from '@playwright/test'

async function topOffset(node: ReturnType<import('@playwright/test').Page['locator']>) {
  return node.evaluate((el) => {
    let scrollAncestor: HTMLElement | null = el.parentElement
    while (scrollAncestor && getComputedStyle(scrollAncestor).overflowY !== 'auto') {
      scrollAncestor = scrollAncestor.parentElement
    }
    if (!scrollAncestor) return null
    const nodeRect = el.getBoundingClientRect()
    const containerRect = scrollAncestor.getBoundingClientRect()
    return nodeRect.top - containerRect.top
  })
}

test('выбранный в таблице узел прижимается к верхнему краю области дерева — и для верхних, и для глубоко вложенных дочерних узлов', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('org-tree').waitFor()

  // Верхняя строка (обычно дивизион верхнего уровня — уже видна, минимум раскрытия).
  const topRow = page.getByTestId('org-table-row').first()
  const topNodeId = await topRow.getAttribute('data-node-id')
  await topRow.click()
  const topTreeNode = page.locator(`[data-testid="org-tree-node"][data-node-id="${topNodeId}"]`)
  await page.waitForTimeout(500)
  expect(Math.abs((await topOffset(topTreeNode))!)).toBeLessThan(5)

  // Глубоко вложенный дочерний узел ближе к концу раскрытой части дерева — требует
  // раскрытия свёрнутого по умолчанию родителя и достаточного запаса для прокрутки.
  const deepRow = page.getByTestId('org-table-row').nth(30)
  const deepNodeId = await deepRow.getAttribute('data-node-id')
  await deepRow.click()
  const deepTreeNode = page.locator(`[data-testid="org-tree-node"][data-node-id="${deepNodeId}"]`)
  await page.waitForTimeout(900)
  expect(Math.abs((await topOffset(deepTreeNode))!)).toBeLessThan(5)
})
