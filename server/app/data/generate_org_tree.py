import random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.models import OrgNode

DIVISION_NAMES = [
    "Дивизион продаж",
    "Дивизион разработки",
    "Дивизион маркетинга",
    "Дивизион операций",
    "Дивизион финансов",
]

DEPARTMENT_NAMES = [
    "Отдел клиентского сервиса",
    "Отдел аналитики",
    "Отдел разработки продукта",
    "Отдел контроля качества",
    "Отдел закупок",
    "Отдел кадров",
    "Отдел логистики",
    "Отдел бухгалтерии",
]

TEAM_NAMES = [
    "Команда фронтенда",
    "Команда бэкенда",
    "Команда инфраструктуры",
    "Команда дизайна",
    "Команда поддержки",
    "Команда исследований",
    "Команда продаж B2B",
    "Команда продаж B2C",
]


def _pick_name(pool: list[str], index: int) -> str:
    base = pool[index % len(pool)]
    cycle = index // len(pool)
    return base if cycle == 0 else f"{base} {cycle + 1}"


def _random_updated_at() -> str:
    days_ago = random.randint(0, 30)
    moment = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return moment.isoformat().replace("+00:00", "Z")


@dataclass
class GenerateOptions:
    divisions_count: int = 5
    departments_per_division: tuple[int, int] = (3, 4)
    teams_per_department: tuple[int, int] = (2, 4)


def generate_org_tree(options: GenerateOptions | None = None) -> list[OrgNode]:
    options = options or GenerateOptions()

    nodes: list[OrgNode] = []
    next_id = 1

    def make_node(parent_id: str | None, name: str) -> OrgNode:
        nonlocal next_id
        node = OrgNode(
            id=str(next_id),
            name=name,
            parentId=parent_id,
            headcount=random.randint(2, 40),
            budget=random.randint(500_000, 20_000_000),
            performance=random.randint(0, 100),
            updatedAt=_random_updated_at(),
        )
        next_id += 1
        return node

    for d in range(options.divisions_count):
        division = make_node(None, _pick_name(DIVISION_NAMES, d))
        nodes.append(division)

        departments_count = random.randint(*options.departments_per_division)

        for dep in range(departments_count):
            department = make_node(division.id, _pick_name(DEPARTMENT_NAMES, dep))
            nodes.append(department)

            teams_count = random.randint(*options.teams_per_department)

            for t in range(teams_count):
                nodes.append(make_node(department.id, _pick_name(TEAM_NAMES, t)))

    return nodes


@dataclass
class IntegrityCheckResult:
    is_valid: bool
    errors: list[str]


def check_org_tree_integrity(nodes: list[OrgNode]) -> IntegrityCheckResult:
    errors: list[str] = []
    ids = {node.id for node in nodes}

    for node in nodes:
        if node.parent_id is not None and node.parent_id not in ids:
            errors.append(
                f"Узел {node.id} ссылается на несуществующего родителя {node.parent_id}"
            )

    return IntegrityCheckResult(is_valid=len(errors) == 0, errors=errors)
