import { expect, test } from "@playwright/test";

test.describe("WS /ws/org-tree", () => {
  test("подключение к live-каналу возвращает корректный патч-объект", async ({
    baseURL,
    request,
  }) => {
    const response = await request.get("/api/org-tree");
    const nodes = await response.json();
    const ids = new Set(nodes.map((n: { id: string }) => n.id));

    const wsUrl = `${baseURL!.replace(/^http/, "ws")}/ws/org-tree`;

    const patch = await new Promise<{
      id: string;
      changes: Record<string, number>;
      updatedAt: string;
    }>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("Патч не получен за отведённое время"));
      }, 10_000);

      ws.addEventListener("message", (event) => {
        clearTimeout(timeout);
        ws.close();
        resolve(JSON.parse(event.data.toString()));
      });
      ws.addEventListener("error", (event) => {
        clearTimeout(timeout);
        reject(event);
      });
    });

    expect(ids.has(patch.id)).toBe(true);
    expect(Object.keys(patch).sort()).toEqual(["changes", "id", "updatedAt"]);
    expect(Object.keys(patch.changes)).toHaveLength(1);

    const [field] = Object.keys(patch.changes);
    expect(["headcount", "budget", "performance"]).toContain(field);
    expect(new Date(patch.updatedAt).toString()).not.toBe("Invalid Date");
  });
});
