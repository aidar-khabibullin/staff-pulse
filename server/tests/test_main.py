import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture(name="live_client")
def live_client_fixture() -> TestClient:
    # WebSocket-тесты требуют запущенного lifespan (фоновая рассылка патчей)
    with TestClient(app) as live_client:
        yield live_client


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


def test_ws_org_tree_streams_valid_patch(live_client: TestClient) -> None:
    response = live_client.get("/api/org-tree")
    ids = {node["id"] for node in response.json()}

    with live_client.websocket_connect("/ws/org-tree") as websocket:
        patch = websocket.receive_json()

    assert patch["id"] in ids
    assert set(patch.keys()) == {"id", "changes", "updatedAt"}
    assert len(patch["changes"]) == 1

    field = next(iter(patch["changes"]))
    assert field in {"headcount", "budget", "performance"}


def test_ws_org_tree_handles_disconnect_without_crashing(live_client: TestClient) -> None:
    with live_client.websocket_connect("/ws/org-tree") as websocket:
        websocket.close()

    # Сервер остаётся работоспособным после отключения клиента
    response = live_client.get("/api/org-tree")
    assert response.status_code == 200
