import asyncio
import contextlib
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGIN, LIVE_UPDATE_INTERVAL_SECONDS
from app.data.generate_org_tree import check_org_tree_integrity, generate_org_tree
from app.live_updates import ConnectionManager, generate_patch
from app.models import OrgNode

org_tree = generate_org_tree()

integrity = check_org_tree_integrity(org_tree)
if not integrity.is_valid:
    raise RuntimeError(
        f"Сгенерированные мок-данные нарушают целостность: {'; '.join(integrity.errors)}"
    )

manager = ConnectionManager()


async def _broadcast_patches_loop() -> None:
    while True:
        await asyncio.sleep(LIVE_UPDATE_INTERVAL_SECONDS)
        patch = generate_patch(org_tree)
        await manager.broadcast(patch.model_dump(by_alias=True))


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    task = asyncio.create_task(_broadcast_patches_loop())
    try:
        yield
    finally:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/org-tree", response_model=list[OrgNode], response_model_by_alias=True)
def get_org_tree() -> list[OrgNode]:
    return org_tree


@app.websocket("/ws/org-tree")
async def ws_org_tree(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
