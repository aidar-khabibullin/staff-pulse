from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGIN
from app.data.generate_org_tree import check_org_tree_integrity, generate_org_tree
from app.models import OrgNode

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

org_tree = generate_org_tree()

integrity = check_org_tree_integrity(org_tree)
if not integrity.is_valid:
    raise RuntimeError(
        f"Сгенерированные мок-данные нарушают целостность: {'; '.join(integrity.errors)}"
    )


@app.get("/api/org-tree", response_model=list[OrgNode], response_model_by_alias=True)
def get_org_tree() -> list[OrgNode]:
    return org_tree
