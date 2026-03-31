const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:18010"


export interface ExplorerProperty {
  label: string
  value: string
}

export interface ExplorerTimelineItem {
  year: string
  event: string
}

export interface ExplorerSource {
  label: string
  url: string
}

export interface ExplorerObject {
  name: string
  type: string
  distance?: string | null
  discovery?: string | null
  analysis: string
  properties: ExplorerProperty[]
  timeline: ExplorerTimelineItem[]
  notes: string[]
  features: string[]
  image_url?: string | null
  source?: ExplorerSource | null
  nasa_id?: string | null
}

export interface ExplorerLookupResult {
  found: boolean
  object?: ExplorerObject
  message?: string
}

const spaceKeywords = [
  "astronom",
  "planet",
  "star",
  "galaxy",
  "nebula",
  "solar system",
  "universe",
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
  "sun",
]

const nonSpaceKeywords = [
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
  "dish",
  "programming language",
  "computer program",
  "disambiguation",
]

function isSpaceRelatedObject(object?: ExplorerObject): boolean {
  if (!object) return false

  const combined = [
    object.name,
    object.type,
    object.analysis,
    ...object.properties.map((prop) => `${prop.label} ${prop.value}`),
    ...object.notes,
  ]
    .join(" ")
    .toLowerCase()

  if (nonSpaceKeywords.some((keyword) => combined.includes(keyword))) {
    return false
  }

  return spaceKeywords.some((keyword) => combined.includes(keyword))
}

export async function askExplorer(question: string): Promise<ExplorerObject> {
  const response = await fetch(`${backendUrl}/api/explorer/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.detail ?? payload.message ?? "Explorer search failed.")
  }

  const payload = await response.json()
  return payload.object as ExplorerObject
}

export async function fetchLiveExplorerObject(name: string): Promise<ExplorerLookupResult> {
  const response = await fetch(`${backendUrl}/api/explorer/object/${encodeURIComponent(name)}/live`, {
    method: "GET",
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.detail ?? payload.message ?? "Explorer object lookup failed.")
  }

  const payload = await response.json()
  const hasObject = Boolean(payload.object)
  const backendFound = typeof payload.found === "boolean" ? payload.found : hasObject
  const object = payload.object as ExplorerObject | undefined
  const found = backendFound && isSpaceRelatedObject(object)

  return {
    found,
    object: found ? object : undefined,
    message: found
      ? typeof payload.message === "string"
        ? payload.message
        : undefined
      : `No results found for '${name}'. Try searching for a known space object like 'Mars', 'Sun', 'Andromeda Galaxy', or 'Black Hole'.`,
  }
}
