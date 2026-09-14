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
