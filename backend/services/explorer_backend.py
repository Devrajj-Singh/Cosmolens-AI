import json
import re
from functools import lru_cache
from pathlib import Path
import requests
from urllib.parse import quote
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.config import OPENAI_API_KEY, OPENAI_MODEL


DATA_PATH = Path(__file__).resolve().parent.parent / "core" / "data" / "space_objects.json"
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
OPENAI_TIMEOUT_SECONDS = 30
WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{name}"
WIKIPEDIA_CONTENT_URL = (
    "https://en.wikipedia.org/w/api.php?action=query&titles={name}"
    "&prop=extracts&explaintext=true&format=json&origin=*"
)
WIKIPEDIA_OPENSEARCH_URL = (
    "https://en.wikipedia.org/w/api.php?action=opensearch"
    "&search={query}&limit=1&format=json&origin=*"
)
WIKIPEDIA_SEARCH_URL = (
    "https://en.wikipedia.org/w/api.php?action=query&list=search"
    "&srsearch={query}&srlimit=5&format=json&origin=*"
)
WIKIPEDIA_TIMEOUT_SECONDS = 15
WIKIPEDIA_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "CosmoLensAI/1.0 (educational project)",
}
PROPERTY_FALLBACK = "\u2014"
DISTANCE_LABEL = "Distance from Earth"
COMMON_OBJECT_ALIASES = {
    "mars": "Mars",
    "mercury": "Mercury",
    "venus": "Venus",
    "earth": "Earth",
    "moon": "Moon",
    "the moon": "Moon",
    "sun": "Sun",
    "jupiter": "Jupiter",
    "saturn": "Saturn",
    "uranus": "Uranus",
    "neptune": "Neptune",
    "pluto": "Pluto",
    "milky way": "Milky Way",
    "andromeda": "Andromeda Galaxy",
    "andromeda galaxy": "Andromeda Galaxy",
    "orion nebula": "Orion Nebula",
    "black hole": "Black hole",
    "black holes": "Black hole",
    "iss": "International Space Station",
    "international space station": "International Space Station",
    "hubble": "Hubble Space Telescope",
    "hubble telescope": "Hubble Space Telescope",
    "sputnik": "Sputnik 1",
    "sputnik 1": "Sputnik 1",
    "ngc 1300": "NGC 1300",
}
COMMON_SPACE_OBJECTS = [
    {"name": "Sun", "type": "Star", "distance": "149.6 million km from Earth", "features": ["The Sun contains more than 99% of the Solar System's mass", "Its energy comes from hydrogen fusion in the core", "Solar activity drives space weather throughout the Solar System"], "discovery": "Known since ancient times"},
    {"name": "Mercury", "type": "Terrestrial planet", "distance": "77 million km from Earth", "features": ["Mercury is the closest planet to the Sun", "It has a heavily cratered rocky surface", "A Mercurian day is longer than its year"], "discovery": "Known since ancient times"},
    {"name": "Venus", "type": "Terrestrial planet", "distance": "38 million km from Earth", "features": ["Venus has a dense carbon dioxide atmosphere", "Its surface is hot enough to melt lead", "Venus rotates in the opposite direction to most planets"], "discovery": "Known since ancient times"},
    {"name": "Earth", "type": "Terrestrial planet", "distance": "0 km (home planet)", "features": ["Earth is the only known world to support life", "About 71% of its surface is covered by oceans", "Its atmosphere protects the surface and regulates climate"], "discovery": "Known since ancient times"},
    {"name": "Moon", "type": "Natural satellite", "distance": "384,400 km from Earth", "features": ["The Moon is Earth's only natural satellite", "Its gravity drives ocean tides on Earth", "The near side is dominated by dark volcanic maria"], "discovery": "Known since ancient times"},
    {"name": "Mars", "type": "Terrestrial planet", "distance": "225 million km from Earth", "features": ["Mars is known as the Red Planet because of iron oxide on its surface", "It has two small moons named Phobos and Deimos", "Olympus Mons is the tallest volcano in the Solar System"], "discovery": "Known since ancient times"},
    {"name": "Jupiter", "type": "Gas giant", "distance": "588 million km from Earth", "features": ["Jupiter is the largest planet in the Solar System", "The Great Red Spot is a giant long-lived storm", "It has dozens of moons including Ganymede, Europa, and Io"], "discovery": "Known since ancient times"},
    {"name": "Saturn", "type": "Gas giant", "distance": "1.2 billion km from Earth", "features": ["Saturn is famous for its bright ring system", "It has many moons including Titan and Enceladus", "Its low density means it is less dense than water"], "discovery": "Known since ancient times"},
    {"name": "Uranus", "type": "Ice giant", "distance": "2.6 billion km from Earth", "features": ["Uranus rotates on its side compared with most planets", "Its atmosphere contains hydrogen, helium, and methane", "The planet has a faint ring system and many moons"], "discovery": "Discovered in 1781"},
    {"name": "Neptune", "type": "Ice giant", "distance": "4.3 billion km from Earth", "features": ["Neptune is the farthest major planet from the Sun", "Its atmosphere hosts extremely fast winds", "Triton is its largest moon and orbits retrograde"], "discovery": "Discovered in 1846"},
    {"name": "Pluto", "type": "Dwarf planet", "distance": "5.0 billion km from Earth", "features": ["Pluto is a dwarf planet in the Kuiper belt", "Its heart-shaped Tombaugh Regio is one of its best-known features", "Charon is large enough to make the system almost a binary world"], "discovery": "Discovered in 1930"},
    {"name": "Black hole", "type": "Compact object", "distance": PROPERTY_FALLBACK, "features": ["Black holes are regions where gravity is strong enough that not even light can escape", "They can form from collapsing massive stars or exist as supermassive black holes in galaxies", "Scientists study them through nearby matter, gravitational waves, and orbital motion"], "discovery": "Predicted in the 20th century"},
    {"name": "International Space Station", "type": "Artificial satellite", "distance": "About 400 km from Earth", "features": ["The ISS is a permanently crewed space station in low Earth orbit", "It travels around Earth roughly every 90 minutes", "NASA, Roscosmos, ESA, JAXA, and CSA operate the station together"], "discovery": "First module launched in 1998"},
    {"name": "Hubble Space Telescope", "type": "Space telescope", "distance": "About 540 km from Earth", "features": ["Hubble observes the universe from low Earth orbit", "It has captured some of the most detailed deep-space images ever made", "Servicing missions upgraded and repaired it several times"], "discovery": "Launched in 1990"},
    {"name": "Sputnik 1", "type": "Artificial satellite", "distance": "Low Earth orbit", "features": ["Sputnik 1 was the first artificial Earth satellite", "Its launch marked the start of the Space Age", "It transmitted radio signals back to Earth for weeks"], "discovery": "Launched in 1957"},
    {"name": "NGC 1300", "type": "Barred spiral galaxy", "distance": "61 million light-years from Earth", "features": ["NGC 1300 is a classic barred spiral galaxy", "Its central bar channels material inward toward the core", "The galaxy is often studied as a textbook grand-design spiral"], "discovery": "Discovered in 1835"},
]
SPACE_RELEVANCE_KEYWORDS = (
    "astronom",
    "planet",
    "star",
    "galaxy",
    "nebula",
    "solar system",
    "constellation",
    "moon",
    "satellite",
    "orbit",
    "orbital",
    "telescope",
    "cosmic",
    "celestial",
    "black hole",
    "quasar",
    "pulsar",
    "comet",
    "asteroid",
    "meteor",
    "exoplanet",
    "interstellar",
    "spacecraft",
    "space station",
)
NON_SPACE_PAGE_KEYWORDS = (
    "film",
    "movie",
    "song",
    "album",
    "band",
    "novel",
    "book",
    "magazine",
    "television",
    "tv series",
    "episode",
    "video game",
    "company",
    "restaurant",
    "food",
    "disambiguation",
)
CONSTELLATION_NAMES = {
    "andromeda",
    "antlia",
    "apus",
    "aquarius",
    "aquila",
    "ara",
    "aries",
    "auriga",
    "bootes",
    "caelum",
    "camelopardalis",
    "cancer",
    "canes venatici",
    "canis major",
    "canis minor",
    "capricornus",
    "carina",
    "cassiopeia",
    "centaurus",
    "cepheus",
    "cetus",
    "chamaeleon",
    "circinus",
    "columba",
    "coma berenices",
    "corona australis",
    "corona borealis",
    "corvus",
    "crater",
    "crux",
    "cygnus",
    "delphinus",
    "dorado",
    "draco",
    "equuleus",
    "eridanus",
    "fornax",
    "gemini",
    "grus",
    "hercules",
    "horologium",
    "hydra",
    "hydrus",
    "indus",
    "lacerta",
    "leo",
    "leo minor",
    "lepus",
    "libra",
    "lupus",
    "lynx",
    "lyra",
    "mensa",
    "microscopium",
    "monoceros",
    "musca",
    "norma",
    "octans",
    "ophiuchus",
    "orion",
    "pavo",
    "pegasus",
    "perseus",
    "phoenix",
    "pictor",
    "pisces",
    "piscis austrinus",
    "puppis",
    "pyxis",
    "reticulum",
    "sagitta",
    "sagittarius",
    "scorpius",
    "sculptor",
    "scutum",
    "serpens",
    "sextans",
    "taurus",
    "telescopium",
    "triangulum",
    "triangulum australe",
    "tucana",
    "ursa major",
    "ursa minor",
    "vela",
    "virgo",
    "volans",
    "vulpecula",
}

EXPLORER_SCHEMA = {
    "name": "explorer_result",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "name": {"type": "string"},
            "type": {"type": "string"},
            "distance": {"type": "string"},
            "discovery": {"type": "string"},
            "analysis": {"type": "string"},
            "properties": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "label": {"type": "string"},
                        "value": {"type": "string"},
                    },
                    "required": ["label", "value"],
                },
            },
            "timeline": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "year": {"type": "string"},
                        "event": {"type": "string"},
                    },
                    "required": ["year", "event"],
                },
            },
            "notes": {
                "type": "array",
                "items": {"type": "string"},
            },
            "features": {
                "type": "array",
                "items": {"type": "string"},
            },
            "image_url": {"type": ["string", "null"]},
            "source": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "label": {"type": "string"},
                    "url": {"type": "string"},
                },
                "required": ["label", "url"],
            },
            "nasa_id": {"type": ["string", "null"]},
        },
        "required": [
            "name",
            "type",
            "distance",
            "discovery",
            "analysis",
            "properties",
            "timeline",
            "notes",
            "features",
            "image_url",
            "source",
            "nasa_id",
        ],
    },
    "strict": True,
}


@lru_cache(maxsize=1)
def _load_space_objects() -> list[dict]:
    with DATA_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def list_objects() -> list[dict]:
    return _load_space_objects()


def _normalize(value: str) -> str:
    return " ".join(value.strip().lower().split())


def resolve_object_from_text(text: str) -> str | None:
    text_lower = text.lower()
    for item in [*_load_space_objects(), *COMMON_SPACE_OBJECTS]:
        if item["name"].lower() in text_lower:
            return item["name"]
    alias = COMMON_OBJECT_ALIASES.get(_normalize(text))
    if alias:
        return alias
    cleaned = text.strip()
    return cleaned or None


def _find_local_object(name: str) -> dict | None:
    normalized = _normalize(name)
    alias = COMMON_OBJECT_ALIASES.get(normalized)
    for item in [*_load_space_objects(), *COMMON_SPACE_OBJECTS]:
        if _normalize(item["name"]) == normalized:
            return item
        if alias and _normalize(item["name"]) == _normalize(alias):
            return item
    return None


def _fallback_payload(query: str, local_item: dict | None) -> dict | None:
    if not local_item:
        return None

    return {
        "name": local_item["name"],
        "type": local_item["type"],
        "distance": local_item["distance"],
        "discovery": local_item["discovery"],
        "analysis": (
            f"{local_item['name']} is a {local_item['type'].lower()} located {local_item['distance']}. "
            f"It is known for {', '.join(local_item['features'][:2]).lower()}."
        ),
        "properties": [
            {"label": DISTANCE_LABEL, "value": local_item["distance"]},
            {"label": "Type", "value": local_item["type"]},
            {"label": "Constellation", "value": "Not available"},
            {"label": "Diameter", "value": "Not available"},
            {"label": "Discovered", "value": local_item["discovery"]},
            {"label": "Agency", "value": "AI Explorer API"},
        ],
        "timeline": [
            {"year": "Discovery", "event": local_item["discovery"]},
            {"year": "Classification", "event": f"Cataloged as {local_item['type']}."},
            {"year": "Highlights", "event": local_item["features"][0]},
            {"year": "Research", "event": local_item["features"][1] if len(local_item["features"]) > 1 else local_item["features"][0]},
        ],
        "notes": [
            f"{local_item['features'][0]}.",
            f"{local_item['features'][1] if len(local_item['features']) > 1 else local_item['features'][0]}.",
            f"{local_item['features'][2] if len(local_item['features']) > 2 else f'Classified as {local_item['type']}.'}",
            f"Studied as part of the CosmoLens local astronomy catalog.",
        ],
        "features": local_item["features"][:4],
        "image_url": None,
        "source": {
            "label": "AI Explorer API",
            "url": "https://api.openai.com/v1/responses",
        },
        "nasa_id": None,
    }


def _extract_response_text(payload: dict) -> str:
    output_text = payload.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text

    for item in payload.get("output", []):
        for content in item.get("content", []):
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return text

    raise ValueError("AI response did not include structured output text.")


def _generate_ai_payload(query: str, local_item: dict | None) -> dict:
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured for the explorer service.")

    local_context = json.dumps(local_item, ensure_ascii=True) if local_item else "No local catalog entry was found."
    prompt = f"""
You are CosmoLens AI. Generate a factual explorer payload for the user query.

User query:
{query}

Local catalog context:
{local_context}

Rules:
- Return JSON only.
- Keep the current UI structure exactly by matching the schema.
- Write exactly 4 notes.
- Write exactly 4 timeline items.
- The `properties` array must be exactly these labels in this order:
  1. Distance from Earth
  2. Type
  3. Constellation
  4. Diameter
  5. Discovered
  6. Agency
- `analysis` must be a short paragraph.
- `source.label` must be "AI Explorer API".
- `source.url` must be "https://api.openai.com/v1/responses".
- `image_url` must be null.
- `nasa_id` must be null.
- If a fact is uncertain, use "Not available" instead of inventing it.
""".strip()

    request_payload = {
        "model": OPENAI_MODEL,
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": EXPLORER_SCHEMA["name"],
                "schema": EXPLORER_SCHEMA["schema"],
                "strict": EXPLORER_SCHEMA["strict"],
            }
        },
    }

    request = Request(
        OPENAI_RESPONSES_URL,
        data=json.dumps(request_payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=OPENAI_TIMEOUT_SECONDS) as response:
            payload = json.load(response)
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="ignore")
        raise ValueError(f"AI explorer request failed: {detail or error.reason}") from error
    except URLError as error:
        raise ValueError(f"AI explorer request failed: {error.reason}") from error

    result = json.loads(_extract_response_text(payload))
    result["notes"] = result.get("notes", [])[:4]
    result["timeline"] = result.get("timeline", [])[:4]
    result["source"] = {
        "label": "AI Explorer API",
        "url": "https://api.openai.com/v1/responses",
    }
    result["image_url"] = None
    result["nasa_id"] = None
    return result


def _fetch_json(url: str, timeout: int = WIKIPEDIA_TIMEOUT_SECONDS) -> dict | None:
    try:
        with requests.Session() as session:
            session.trust_env = False
            response = session.get(url, headers=WIKIPEDIA_HEADERS, timeout=timeout)
            response.raise_for_status()
            return response.json()
    except (requests.RequestException, json.JSONDecodeError, ValueError, TimeoutError):
        return None


def clean_query(query: str) -> str:
    cleaned = query.strip()
    cleaned = cleaned.title()
    cleaned = cleaned.replace(" ", "_")
    return cleaned


def _clean_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def _split_paragraphs(text: str) -> list[str]:
    return [_clean_text(part) for part in re.split(r"\n\s*\n", text) if _clean_text(part)]


def _split_sentences(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", normalized) if part.strip()]


def _first_match(patterns: list[str], text: str) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            for group in match.groups():
                if group:
                    return _clean_text(group.rstrip(".,;:"))
    return None


def _extract_object_type(summary_text: str, full_text: str) -> str:
    type_from_summary = _first_match(
        [
            r"\bis an? ([^.]+?)(?: located| in the constellation| in | that | with | and |,|\.)",
            r"\bis the ([^.]+?)(?: located| in the constellation| in | that | with | and |,|\.)",
        ],
        summary_text,
    )
    if type_from_summary:
        return type_from_summary

    type_from_full_text = _first_match(
        [
            r"\bis an? ([^.]+?)(?: located| in the constellation| in | that | with | and |,|\.)",
            r"\bis the ([^.]+?)(?: located| in the constellation| in | that | with | and |,|\.)",
        ],
        full_text,
    )
    return type_from_full_text or PROPERTY_FALLBACK


def _truncate_text(value: str, limit: int) -> str:
    cleaned = _clean_text(value)
    if len(cleaned) <= limit:
        return cleaned
    clipped = cleaned[: limit - 3].rsplit(" ", 1)[0].rstrip(" ,;:")
    return f"{clipped or cleaned[: limit - 3]}..."


def _extract_property_value(label: str, full_text: str) -> str:
    if label == DISTANCE_LABEL:
        earth_patterns = [
            r"(?:about|approximately|around|nearly|roughly)?\s*([0-9][0-9,.\-\s]*(?:million|billion|thousand)?\s*(?:light[- ]years?|ly|AU|astronomical units?|parsecs?|pc|kiloparsecs?|kpc|megaparsecs?|mpc))\s+(?:away\s+from|from)\s+Earth",
            r"distance\s+from\s+Earth(?:\s+is|\s+of|:)?\s+([0-9][0-9,.\-\s]*(?:million|billion|thousand)?\s*(?:light[- ]years?|ly|AU|astronomical units?|parsecs?|pc|kiloparsecs?|kpc|megaparsecs?|mpc))",
            r"([0-9][0-9,.\-\s]*(?:million|billion|thousand)?\s*(?:light[- ]years?|ly|AU|astronomical units?|parsecs?|pc|kiloparsecs?|kpc|megaparsecs?|mpc))\s+from\s+Earth",
        ]
        for pattern in earth_patterns:
            match = re.search(pattern, full_text, flags=re.IGNORECASE)
            if match:
                value = match.group(1) if match.groups() else match.group(0)
                return _clean_text(value)

    pattern_map = {
        DISTANCE_LABEL: [
            r"([0-9][0-9,.\-\s]*(?:million|billion|thousand)?\s*(?:light[- ]years?|ly|AU|astronomical units?|parsecs?|pc|kiloparsecs?|kpc|megaparsecs?|mpc))(?:\s+away|\s+from)",
            r"distance(?:\s+of|\s+is|\s+to)?\s+([0-9][0-9,.\-\s]*(?:million|billion|thousand)?\s*(?:light[- ]years?|ly|AU|astronomical units?|parsecs?|pc|kiloparsecs?|kpc|megaparsecs?|mpc))",
            r"\b([0-9][0-9,.\-\s]*(?:million|billion|thousand)?\s*light[- ]years?)\b",
            r"\b([0-9][0-9,.\-\s]*(?:ly|AU|astronomical units?))\b",
        ],
        "Diameter": [
            r"diameter(?:\s+of|\s+is|:)?\s+([0-9][0-9,.\-\s]*(?:km|kilomet(?:er|re)s?|miles?|mi|light[- ]years?|ly))",
            r"([0-9][0-9,.\-\s]*(?:km|kilomet(?:er|re)s?|miles?|mi|light[- ]years?|ly))\s+in diameter",
            r"diameter[^.]{0,40}\b([0-9][0-9,.\-\s]*(?:km|kilomet(?:er|re)s?|miles?|mi))\b",
        ],
        "Discovered": [
            r"known since ancient times",
            r"discovered\s+in\s+(\d{3,4})",
            r"discovery\s+in\s+(\d{3,4})",
            r"observed\s+in\s+(\d{3,4})",
            r"first observed\s+in\s+(\d{3,4})",
            r"recorded\s+in\s+(\d{3,4})",
        ],
        "Agency": [
            r"\b(NASA)\b",
            r"\b(ESA)\b",
            r"\b(ISRO)\b",
        ],
    }

    if label == "Constellation":
        lowered = full_text.lower()
        explicit_match = re.search(
            r"(?:in|within)\s+the\s+constellation\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            full_text,
            flags=re.IGNORECASE,
        )
        if explicit_match:
            candidate = _clean_text(explicit_match.group(1))
            if candidate.lower() in CONSTELLATION_NAMES:
                return candidate

        for name in sorted(CONSTELLATION_NAMES, key=len, reverse=True):
            if re.search(rf"\b{name}\b", lowered, flags=re.IGNORECASE):
                return " ".join(part.capitalize() for part in name.split())
        return PROPERTY_FALLBACK

    for pattern in pattern_map.get(label, []):
        match = re.search(pattern, full_text, flags=re.IGNORECASE)
        if not match:
            continue
        if label == "Discovered" and match.group(0).lower() == "known since ancient times":
            return "Known since ancient times"
        value = match.group(1) if match.groups() else match.group(0)
        return _clean_text(value)

    return PROPERTY_FALLBACK


def _extract_timeline(full_text: str) -> list[dict]:
    timeline: list[dict] = []
    seen: set[tuple[str, str]] = set()
    excluded_markers = (
        "doi:",
        "isbn",
        "issn",
        "pmid",
        "pmc",
        "arxiv",
        "bibcode",
        "s2cid",
        "retrieved",
        "archived from",
        "citation",
        "journal",
        "volume ",
        "issue ",
        "pp.",
    )
    event_keywords = (
        "discover",
        "observe",
        "identify",
        "record",
        "classif",
        "measure",
        "mission",
        "launch",
        "study",
        "image",
        "analysis",
        "named",
        "proposed",
        "published",
        "detected",
        "confirmed",
        "announced",
        "found",
    )

    sentences = _split_sentences(full_text)

    def add_event(sentence: str) -> bool:
        event = _clean_text(sentence)
        normalized = event.lower()
        if len(event) < 30:
            return False
        if any(marker in normalized for marker in excluded_markers):
            return False
        if re.fullmatch(r"[\d\s:;.,()/\-A-Za-z]+", event) and not any(char.islower() for char in event):
            return False

        years = re.findall(r"\b(1[0-9]{3}|20[0-9]{2})\b", sentence)
        if not years:
            return False

        year = min(years)
        key = (year, event.lower())
        if key in seen:
            return False
        seen.add(key)
        timeline.append({"year": year, "event": event})
        return True

    for sentence in sentences:
        normalized = _clean_text(sentence).lower()
        if not any(keyword in normalized for keyword in event_keywords):
            continue
        add_event(sentence)

    if len(timeline) < 4:
        for sentence in sentences:
            add_event(sentence)
            if len(timeline) >= 6:
                break

    timeline.sort(key=lambda item: (int(item["year"]), item["event"]))
    return timeline[:6]


def _normalize_text_for_compare(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _build_analysis(summary_text: str, display_name: str) -> str:
    summary_sentences = _split_sentences(summary_text)
    if summary_sentences:
        return " ".join(summary_sentences[:3])
    return f"Wikipedia data is available for {display_name}."


def _extract_notes(summary_text: str, full_text: str) -> list[str]:
    paragraphs = _split_paragraphs(full_text)
    if len(paragraphs) <= 1:
        return []

    intro_sentences = {
        _normalize_text_for_compare(sentence)
        for sentence in _split_sentences(summary_text)
    }
    note_keywords = (
        "physical",
        "structure",
        "composition",
        "surface",
        "feature",
        "features",
        "atmosphere",
        "core",
        "mantle",
        "crust",
        "geology",
        "volcano",
        "crater",
        "moon",
        "moons",
        "ring",
        "rings",
        "dust",
        "gas",
        "ice",
        "mineral",
        "terrain",
        "temperature",
        "magnetic",
        "gravity",
        "density",
        "composition",
        "surface features",
    )

    candidates: list[str] = []
    seen: set[str] = set()

    for paragraph in paragraphs[1:]:
        for sentence in _split_sentences(paragraph):
            normalized = _normalize_text_for_compare(sentence)
            if not normalized or normalized in intro_sentences or normalized in seen:
                continue
            if len(sentence) < 25:
                continue
            if not any(keyword in normalized for keyword in note_keywords):
                continue
            candidates.append(sentence)
            seen.add(normalized)

    if len(candidates) < 4:
        for paragraph in paragraphs[1:]:
            for sentence in _split_sentences(paragraph):
                normalized = _normalize_text_for_compare(sentence)
                if not normalized or normalized in intro_sentences or normalized in seen:
                    continue
                if len(sentence) < 25:
                    continue
                candidates.append(sentence)
                seen.add(normalized)
                if len(candidates) >= 4:
                    break
            if len(candidates) >= 4:
                break

    notes: list[str] = []
    for sentence in candidates[:4]:
        notes.append(_truncate_text(sentence, 150))

    return notes


def _extract_type_from_summary(summary_payload: dict | None, summary_text: str, full_text: str) -> str:
    description = _clean_text((summary_payload or {}).get("description"))
    if description:
        return description[:1].upper() + description[1:]
    return _extract_object_type(summary_text, full_text)


def _build_properties(object_type: str, full_text: str) -> list[dict]:
    constellation = _extract_property_value("Constellation", full_text)
    if constellation == PROPERTY_FALLBACK and "planet" in object_type.lower():
        constellation = "Varies (planet)"

    agency = _extract_property_value("Agency", full_text)
    if agency != PROPERTY_FALLBACK and "planet" in object_type.lower() and agency == "NASA":
        agency = "NASA (most missions)"

    return [
        {"label": DISTANCE_LABEL, "value": _extract_property_value(DISTANCE_LABEL, full_text)},
        {"label": "Type", "value": object_type or PROPERTY_FALLBACK},
        {"label": "Constellation", "value": constellation},
        {"label": "Diameter", "value": _extract_property_value("Diameter", full_text)},
        {"label": "Discovered", "value": _extract_property_value("Discovered", full_text)},
        {"label": "Agency", "value": agency},
    ]


def _set_property(properties: list[dict], label: str, value: str) -> list[dict]:
    updated = False
    next_properties: list[dict] = []

    for item in properties:
        if item["label"] == label:
            next_properties.append({"label": label, "value": value})
            updated = True
            continue
        next_properties.append(item)

    if not updated:
        next_properties.append({"label": label, "value": value})

    return next_properties


def _extract_features(notes: list[str], full_text: str) -> list[str]:
    features: list[str] = []
    for sentence in _split_sentences(full_text):
        cleaned = _clean_text(sentence)
        if len(cleaned) < 40:
            continue
        features.append(cleaned)
        if len(features) >= 4:
            break

    if len(features) < 4:
        for note in notes:
            if note not in features:
                features.append(note)
            if len(features) >= 4:
                break

    return features[:4]


def _extract_wikipedia_content(payload: dict | None) -> str:
    if not payload:
        return ""

    pages = payload.get("query", {}).get("pages", {})
    if not isinstance(pages, dict):
        return ""

    for page in pages.values():
        extract = page.get("extract")
        if isinstance(extract, str) and extract.strip():
            return extract.strip()

    return ""


def _extract_wikipedia_search_titles(payload: dict | None) -> list[str]:
    if not payload:
        return []

    results = payload.get("query", {}).get("search", [])
    if not isinstance(results, list):
        return []

    titles: list[str] = []
    for result in results:
        title = _clean_text(result.get("title")) if isinstance(result, dict) else ""
        if title and title not in titles:
            titles.append(title)
    return titles


def _extract_wikipedia_opensearch_title(payload: object) -> str | None:
    if not isinstance(payload, list) or len(payload) < 2:
        return None
    titles = payload[1]
    if not isinstance(titles, list) or not titles:
        return None
    first_title = titles[0]
    if isinstance(first_title, str):
        cleaned = _clean_text(first_title)
        return cleaned or None
    return None


def _summary_indicates_missing(summary_payload: dict | None) -> bool:
    if not summary_payload:
        return True

    title = _clean_text(summary_payload.get("title"))
    description = _clean_text(summary_payload.get("description")).lower()
    extract = _clean_text(summary_payload.get("extract")).lower()

    if summary_payload.get("type") == "https://mediawiki.org/wiki/HyperSwitch/errors/not_found":
        return True
    if title.lower() in {"not found", "not found."}:
        return True
    if not extract:
        return True
    if "refer to:" in extract or "may refer to:" in extract:
        return True
    if "wikimedia disambiguation page" in description or "disambiguation page" in description:
        return True
    return False


def _candidate_wikipedia_titles(query: str) -> list[str]:
    candidates: list[str] = []

    def add_candidate(value: str) -> None:
        cleaned = _clean_text(value.replace("_", " "))
        if cleaned and cleaned not in candidates:
            candidates.append(cleaned)

    cleaned_query = clean_query(query)
    alias = COMMON_OBJECT_ALIASES.get(_normalize(query))
    if alias:
        add_candidate(alias)
    add_candidate(cleaned_query)
    add_candidate(query)
    add_candidate(query.upper())
    add_candidate(query.title())

    opensearch_payload = _fetch_json(WIKIPEDIA_OPENSEARCH_URL.format(query=quote(query.strip(), safe="")))
    opensearch_title = _extract_wikipedia_opensearch_title(opensearch_payload)
    if opensearch_title:
        add_candidate(opensearch_title)

    search_payload = _fetch_json(WIKIPEDIA_SEARCH_URL.format(query=quote(query, safe="")))
    for title in _extract_wikipedia_search_titles(search_payload):
        add_candidate(title)

    return candidates


def _fetch_wikipedia_candidate(title: str) -> tuple[dict | None, str]:
    encoded_name = quote(title.replace("_", " "), safe="")
    summary_payload = _fetch_json(WIKIPEDIA_SUMMARY_URL.format(name=encoded_name))
    content_payload = _fetch_json(WIKIPEDIA_CONTENT_URL.format(name=encoded_name))
    return summary_payload, _extract_wikipedia_content(content_payload)


def _is_space_related(summary_payload: dict | None, full_text: str) -> bool:
    title = _clean_text((summary_payload or {}).get("title"))
    if _find_local_object(title):
        return True

    description = _clean_text((summary_payload or {}).get("description")).lower()
    summary_text = _clean_text((summary_payload or {}).get("extract")).lower()
    title_lower = title.lower()
    combined = " ".join(part for part in [title_lower, description, summary_text[:400]] if part)

    if any(keyword in f"{title_lower} {description}" for keyword in NON_SPACE_PAGE_KEYWORDS):
        return False

    return any(keyword in combined for keyword in SPACE_RELEVANCE_KEYWORDS)


def fetch_wikipedia_data(object_name: str) -> dict:
    query = object_name.strip()
    if not query:
        return {}

    summary_payload: dict | None = None
    full_text = ""
    display_name = query

    for candidate in _candidate_wikipedia_titles(query):
        candidate_summary, candidate_full_text = _fetch_wikipedia_candidate(candidate)
        candidate_display_name = _clean_text((candidate_summary or {}).get("title")) or candidate
        if _summary_indicates_missing(candidate_summary) and not candidate_full_text:
            continue
        if not _clean_text((candidate_summary or {}).get("extract")) and not candidate_full_text:
            continue
        if not _is_space_related(candidate_summary, candidate_full_text):
            continue

        summary_payload = candidate_summary
        full_text = candidate_full_text
        display_name = candidate_display_name
        break

    summary_text = _clean_text((summary_payload or {}).get("extract"))

    if not summary_text and not full_text:
        return {}

    object_type = _extract_type_from_summary(summary_payload, summary_text, full_text)
    properties = _build_properties(object_type, full_text)
    local_item = _find_local_object(display_name) or _find_local_object(query)
    if local_item and local_item.get("distance"):
        properties = _set_property(properties, DISTANCE_LABEL, local_item["distance"])

    analysis_text = _build_analysis(summary_text, display_name)
    timeline = _extract_timeline(full_text)
    notes = _extract_notes(summary_text, full_text)

    return {
        "name": display_name,
        "type": object_type,
        "distance": next((item["value"] for item in properties if item["label"] == DISTANCE_LABEL), PROPERTY_FALLBACK),
        "discovery": next((item["value"] for item in properties if item["label"] == "Discovered"), PROPERTY_FALLBACK),
        "analysis": analysis_text,
        "properties": properties,
        "timeline": timeline,
        "notes": notes,
        "features": _extract_features(notes, full_text or summary_text),
        "image_url": None,
        "source": {
            "label": "Wikipedia",
            "url": f"https://en.wikipedia.org/wiki/{quote(display_name.replace(' ', '_'), safe=':_()')}",
        },
        "nasa_id": None,
    }


def get_live_object_payload(name: str) -> dict | None:
    payload = fetch_wikipedia_data(name)
    if payload:
        return payload

    local_item = _find_local_object(name)
    return _fallback_payload(name, local_item)


def get_object_payload(name: str) -> dict | None:
    query = name.strip()
    if not query:
        return None

    local_item = _find_local_object(query)

    try:
        return _generate_ai_payload(query, local_item)
    except ValueError as error:
        if "OPENAI_API_KEY is not configured" in str(error) and not local_item:
            raise
        return _fallback_payload(query, local_item)


def search_objects(query: str) -> list[dict]:
    payload = get_object_payload(query)
    return [payload] if payload else []
