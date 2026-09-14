import random
from datetime import datetime, timezone

from fastapi import WebSocket

from app.models import OrgNode, OrgNodePatch

PATCHABLE_FIELDS = ("headcount", "budget", "performance")

_FIELD_DELTA_RANGE = {
    "headcount": (-3, 3),
    "budget": (-500_000, 500_000),
    "performance": (-10, 10),
}

_FIELD_BOUNDS = {
    "headcount": (1, None),
    "budget": (100_000, None),
    "performance": (0, 100),
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _clamp(value: int, field: str) -> int:
    low, high = _FIELD_BOUNDS[field]
    if low is not None:
        value = max(low, value)
    if high is not None:
        value = min(high, value)
    return value


def generate_patch(nodes: list[OrgNode]) -> OrgNodePatch:
    """Выбирает случайный узел и случайное поле, мутирует узел in-place и
    возвращает патч, описывающий это изменение (контракт: id, changes,
    updatedAt)."""

    node = random.choice(nodes)
    field = random.choice(PATCHABLE_FIELDS)

    delta_low, delta_high = _FIELD_DELTA_RANGE[field]
    new_value = _clamp(getattr(node, field) + random.randint(delta_low, delta_high), field)
    setattr(node, field, new_value)

    updated_at = _now_iso()
    node.updated_at = updated_at

    return OrgNodePatch(id=node.id, changes={field: new_value}, updatedAt=updated_at)


class ConnectionManager:
    """Живой список WebSocket-подключений; рассылка не должна падать при
    обрыве соединения у одного из клиентов."""

    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)

    async def broadcast(self, message: dict) -> None:
        stale: list[WebSocket] = []
        for connection in self._connections:
            try:
                await connection.send_json(message)
            except Exception:
                stale.append(connection)
        for connection in stale:
            self.disconnect(connection)
