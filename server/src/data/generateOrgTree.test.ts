import { describe, expect, it } from "vitest";
import { checkOrgTreeIntegrity, generateOrgTree } from "./generateOrgTree.js";

function getDepth(nodeId: string, byId: Map<string, { parentId: string | null }>): number {
  let depth = 1;
  let current = byId.get(nodeId);
  while (current?.parentId) {
    depth++;
    current = byId.get(current.parentId);
  }
  return depth;
}

describe("generateOrgTree", () => {
  it("генерирует не менее 40 узлов", () => {
    const nodes = generateOrgTree();
    expect(nodes.length).toBeGreaterThanOrEqual(40);
  });

  it("генерирует не менее 3 уровней вложенности", () => {
    const nodes = generateOrgTree();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const maxDepth = Math.max(...nodes.map((n) => getDepth(n.id, byId)));
    expect(maxDepth).toBeGreaterThanOrEqual(3);
  });

  it("каждый узел содержит все обязательные поля корректных типов", () => {
    const nodes = generateOrgTree();
    for (const node of nodes) {
      expect(typeof node.id).toBe("string");
      expect(typeof node.name).toBe("string");
      expect(node.parentId === null || typeof node.parentId === "string").toBe(true);
      expect(typeof node.headcount).toBe("number");
      expect(typeof node.budget).toBe("number");
      expect(node.performance).toBeGreaterThanOrEqual(0);
      expect(node.performance).toBeLessThanOrEqual(100);
      expect(typeof node.updatedAt).toBe("string");
      expect(() => new Date(node.updatedAt).toISOString()).not.toThrow();
    }
  });

  it("проходит проверку внутренней целостности (все parentId существуют)", () => {
    const nodes = generateOrgTree();
    const result = checkOrgTreeIntegrity(nodes);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("обнаруживает битую ссылку parentId", () => {
    const nodes = generateOrgTree();
    const broken = [...nodes, { ...nodes[0], id: "broken", parentId: "does-not-exist" }];
    const result = checkOrgTreeIntegrity(broken);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("содержит хотя бы один корневой узел (parentId === null)", () => {
    const nodes = generateOrgTree();
    expect(nodes.some((n) => n.parentId === null)).toBe(true);
  });
});
