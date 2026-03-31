from fastapi import APIRouter, HTTPException, Query

from backend.schemas.explorer import ExplorerQuestionRequest
from backend.services.explorer_backend import (
    fetch_wikipedia_data,
    get_object_payload,
    get_live_object_payload,
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


@router.get("/object/{name}/live")
def get_live_object(name: str) -> dict:
    payload = get_live_object_payload(name)
    if not payload:
        return {
            "found": False,
            "message": (
                f"No results found for '{name}'. "
                "Try searching for a known space object like "
                "'Andromeda Galaxy', 'Black Hole', or 'Mars'."
            ),
        }

    return {"found": True, "object": payload}


@router.get("/search")
def search(q: str = Query(..., min_length=1)) -> dict:
    payload = fetch_wikipedia_data(q)
    if not payload:
        return {
            "found": False,
            "message": (
                f"No results found for '{q}'. "
                "Try searching for a known space object like "
                "'Andromeda Galaxy', 'Black Hole', or 'Mars'."
            ),
        }
    return {"found": True, "object": payload}


@router.post("/ask")
def ask_explorer(body: ExplorerQuestionRequest) -> dict:
    query = resolve_object_from_text(body.question)
    if not query:
        raise HTTPException(
            status_code=404,
            detail="No matching object found. Try Milky Way, Andromeda Galaxy, Orion Nebula, or another space object.",
        )

    try:
        payload = get_object_payload(query)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not payload:
        raise HTTPException(
            status_code=404,
            detail="No explorer result found from the local catalog or AI explorer service.",
        )
    
    return {
        "question": body.question,
        "object": payload,
    }
    
