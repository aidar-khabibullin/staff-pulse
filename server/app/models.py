from pydantic import BaseModel, ConfigDict, Field


class OrgNode(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    parent_id: str | None = Field(alias="parentId")
    headcount: int
    budget: int
    performance: int
    updated_at: str = Field(alias="updatedAt")


class OrgNodePatch(BaseModel):
    """Контракт live-патча: id узла, изменённые поля и новый updatedAt.

    `changes` содержит только реально изменившиеся поля узла
    (подмножество headcount/budget/performance) — без полного узла.
    """

    model_config = ConfigDict(populate_by_name=True)

    id: str
    changes: dict[str, int]
    updated_at: str = Field(alias="updatedAt")
