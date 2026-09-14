from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_org_tree_returns_valid_payload() -> None:
    response = client.get("/api/org-tree")
    assert response.status_code == 200

    nodes = response.json()
    assert isinstance(nodes, list)
    assert len(nodes) >= 40

    for node in nodes:
        assert set(node.keys()) == {
            "id",
            "name",
            "parentId",
            "headcount",
            "budget",
            "performance",
            "updatedAt",
        }
