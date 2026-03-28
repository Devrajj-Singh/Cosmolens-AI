from fastapi import APIRouter, HTTPException, Query

from backend.schemas.explorer import ExplorerQuestionRequest
from backend.services.explorer_backend import (
    get_object_payload,
    list_objects,
    resolve_object_from_text,
    search_objects,
)


router = APIRouter()


@router.get("/objects")
def get_objects() -> dict:
    return {"objects": list_objects()}


@router.get("/objects/{name}")
def get_object(name: str) -> dict:
    payload = get_object_payload(name)
    if not payload:
        raise HTTPException(status_code=404, detail=f"Space object '{name}' not found.")
    return {"object": payload}


@router.get("/search")
def search(q: str = Query(..., min_length=1)) -> dict:
    results = search_objects(q)
    return {"query": q, "count": len(results), "results": results}


@router.post("/ask")
def ask_explorer(body: ExplorerQuestionRequest) -> dict:
    matched_name = resolve_object_from_text(body.question)
    if not matched_name:
        raise HTTPException(
            status_code=404,
            detail="No matching object found. Try Milky Way, Andromeda Galaxy, or Orion Nebula.",
        )

    payload = get_object_payload(matched_name)
    return {
        "question": body.question,
        "object": payload,
    }
