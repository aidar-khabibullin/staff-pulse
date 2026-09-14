import { expect, test } from "@playwright/test";

test.describe("GET /api/org-tree", () => {
  test("возвращает валидный массив >=40 узлов с >=3 уровнями вложенности", async ({
    request,
  }) => {
    const response = await request.get("/api/org-tree");
    expect(response.ok()).toBeTruthy();

    const nodes = await response.json();
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThanOrEqual(40);

    const byId = new Map(nodes.map((n: { id: string }) => [n.id, n]));
    const depthOf = (id: string): number => {
      let depth = 1;
      let current = byId.get(id);
      while (current?.parentId) {
        depth++;
        current = byId.get(current.parentId);
      }
      return depth;
    };
    const maxDepth = Math.max(...nodes.map((n: { id: string }) => depthOf(n.id)));
    expect(maxDepth).toBeGreaterThanOrEqual(3);

    for (const node of nodes) {
      expect(node).toHaveProperty("id");
      expect(node).toHaveProperty("name");
      expect(node).toHaveProperty("parentId");
      expect(node).toHaveProperty("headcount");
      expect(node).toHaveProperty("budget");
      expect(node.performance).toBeGreaterThanOrEqual(0);
      expect(node.performance).toBeLessThanOrEqual(100);
      expect(node).toHaveProperty("updatedAt");
      if (node.parentId !== null) {
        expect(byId.has(node.parentId)).toBe(true);
      }
    }
  });
});
