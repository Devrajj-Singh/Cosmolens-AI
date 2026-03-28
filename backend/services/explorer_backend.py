import json
from pathlib import Path


DATA_PATH = Path(__file__).resolve().parent.parent / "core" / "data" / "space_objects.json"


def _load_space_objects() -> list[dict]:
    with DATA_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def list_objects() -> list[dict]:
    return _load_space_objects()


def resolve_object_from_text(text: str) -> str | None:
    text_lower = text.lower()
    for item in _load_space_objects():
        if item["name"].lower() in text_lower:
            return item["name"]
    return None


def _to_payload(item: dict) -> dict:
    return {
        "name": item["name"],
        "type": item["type"],
        "distance": item["distance"],
        "analysis": (
            f"{item['name']} is a {item['type'].lower()} located {item['distance']}. "
            f"Important highlights include {', '.join(item['features'][:2]).lower()}."
        ),
        "properties": [
            {"label": "Distance", "value": item["distance"]},
            {"label": "Type", "value": item["type"]},
            {"label": "Discovery", "value": item["discovery"]},
        ],
        "timeline": [
            {"year": "Discovery", "event": item["discovery"]},
            {"year": "Classification", "event": f"Cataloged as {item['type']}."},
            {"year": "Highlights", "event": "; ".join(item["features"])},
        ],
        "notes": [
            f"Known features: {', '.join(item['features'])}.",
            f"Distance reference: {item['distance']}.",
            f"Discovery record: {item['discovery']}.",
        ],
        "features": item["features"],
        "discovery": item["discovery"],
    }


def get_object_payload(name: str) -> dict | None:
    normalized = name.strip().lower()
    for item in _load_space_objects():
        if item["name"].lower() == normalized:
            return _to_payload(item)
    return None


def search_objects(query: str) -> list[dict]:
    query_lower = query.strip().lower()
    results = []
    for item in _load_space_objects():
        corpus = " ".join(
            [
                item["name"],
                item["type"],
                item["distance"],
                item["discovery"],
                *item["features"],
            ]
        ).lower()
        if query_lower in corpus:
            results.append(_to_payload(item))
    return results
