from datetime import datetime

from app.data.generate_org_tree import check_org_tree_integrity, generate_org_tree
from app.models import OrgNode


def _depth(node_id: str, by_id: dict[str, OrgNode]) -> int:
    depth = 1
    current = by_id.get(node_id)
    while current is not None and current.parent_id is not None:
        depth += 1
        current = by_id.get(current.parent_id)
    return depth


def test_generates_at_least_40_nodes() -> None:
    nodes = generate_org_tree()
    assert len(nodes) >= 40


def test_generates_at_least_3_levels_of_nesting() -> None:
    nodes = generate_org_tree()
    by_id = {node.id: node for node in nodes}
    max_depth = max(_depth(node.id, by_id) for node in nodes)
    assert max_depth >= 3


def test_every_node_has_required_fields_of_correct_type() -> None:
    nodes = generate_org_tree()
    for node in nodes:
        assert isinstance(node.id, str)
        assert isinstance(node.name, str)
        assert node.parent_id is None or isinstance(node.parent_id, str)
        assert isinstance(node.headcount, int)
        assert isinstance(node.budget, int)
        assert 0 <= node.performance <= 100
        assert isinstance(node.updated_at, str)
        datetime.fromisoformat(node.updated_at.replace("Z", "+00:00"))


def test_passes_internal_integrity_check() -> None:
    nodes = generate_org_tree()
    result = check_org_tree_integrity(nodes)
    assert result.is_valid
    assert result.errors == []


def test_detects_broken_parent_id_reference() -> None:
    nodes = generate_org_tree()
    broken = [*nodes, nodes[0].model_copy(update={"id": "broken", "parent_id": "does-not-exist"})]
    result = check_org_tree_integrity(broken)
    assert not result.is_valid
    assert len(result.errors) > 0


def test_has_at_least_one_root_node() -> None:
    nodes = generate_org_tree()
    assert any(node.parent_id is None for node in nodes)
