from datetime import datetime

from app.data.generate_org_tree import generate_org_tree
from app.live_updates import PATCHABLE_FIELDS, generate_patch


def test_generate_patch_returns_valid_contract() -> None:
    nodes = generate_org_tree()
    ids = {node.id for node in nodes}

    patch = generate_patch(nodes)

    assert patch.id in ids
    assert len(patch.changes) == 1

    field, value = next(iter(patch.changes.items()))
    assert field in PATCHABLE_FIELDS
    assert isinstance(value, int)
    if field == "performance":
        assert 0 <= value <= 100
    elif field == "headcount":
        assert value >= 1
    elif field == "budget":
        assert value >= 100_000

    # updatedAt — валидный ISO8601 (парсится без исключений)
    datetime.fromisoformat(patch.updated_at.replace("Z", "+00:00"))


def test_generate_patch_mutates_target_node() -> None:
    nodes = generate_org_tree()

    patch = generate_patch(nodes)

    node = next(n for n in nodes if n.id == patch.id)
    field, value = next(iter(patch.changes.items()))
    assert getattr(node, field) == value
    assert node.updated_at == patch.updated_at
