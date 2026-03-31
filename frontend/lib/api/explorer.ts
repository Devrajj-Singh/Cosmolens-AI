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

const localExplorerObjects: Record<string, ExplorerObject> = {
  sun: {
    name: "Sun",
    type: "Star",
    distance: "149.6 million km from Earth",
    discovery: "Known since ancient times",
    analysis:
      "The Sun is the star at the center of our Solar System. It powers the planets with light and heat and contains more than 99% of the Solar System's mass.",
    properties: [
      { label: "Distance from Earth", value: "149.6 million km from Earth" },
      { label: "Type", value: "Star" },
      { label: "Constellation", value: "Not applicable" },
      { label: "Diameter", value: "1.39 million km" },
      { label: "Discovered", value: "Known since ancient times" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "Ancient", event: "The Sun has been observed and studied since ancient times." },
      { year: "1609", event: "Galileo used a telescope to study sunspots." },
      { year: "20th c.", event: "Scientists explained solar energy through nuclear fusion." },
      { year: "Today", event: "Space missions continuously monitor solar activity and space weather." },
    ],
    notes: [
      "The Sun is a medium-sized G-type main-sequence star.",
      "Its energy comes from hydrogen fusion in the core.",
      "Solar wind and flares affect planets and spacecraft across the Solar System.",
      "The Sun is the main source of energy for life on Earth.",
    ],
    features: [
      "Contains more than 99% of the Solar System's mass",
      "Produces energy through hydrogen fusion",
      "Drives space weather with solar flares and solar wind",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  mercury: {
    name: "Mercury",
    type: "Terrestrial planet",
    distance: "77 million km from Earth",
    discovery: "Known since ancient times",
    analysis:
      "Mercury is the closest planet to the Sun and the smallest major planet in the Solar System. It has a rocky, cratered surface and extreme temperature changes.",
    properties: [
      { label: "Distance from Earth", value: "77 million km from Earth" },
      { label: "Type", value: "Terrestrial planet" },
      { label: "Constellation", value: "Varies (planet)" },
      { label: "Diameter", value: "4,879 km" },
      { label: "Discovered", value: "Known since ancient times" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "Ancient", event: "Mercury was known to early sky watchers." },
      { year: "1974", event: "Mariner 10 captured the first close-up images of Mercury." },
      { year: "2008", event: "MESSENGER began major observations of Mercury." },
      { year: "Today", event: "Mercury remains important for studying rocky planet formation." },
    ],
    notes: [
      "Mercury has almost no atmosphere compared with Earth.",
      "A Mercurian day is longer than its year.",
      "Its surface is heavily cratered, similar in some ways to the Moon.",
      "Temperatures on Mercury vary drastically between day and night.",
    ],
    features: [
      "Closest planet to the Sun",
      "Smallest major planet in the Solar System",
      "Heavily cratered rocky surface",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  venus: {
    name: "Venus",
    type: "Terrestrial planet",
    distance: "38 million km from Earth",
    discovery: "Known since ancient times",
    analysis:
      "Venus is a rocky planet with a dense carbon dioxide atmosphere and an extreme greenhouse effect. It is one of the brightest objects visible in Earth's sky.",
    properties: [
      { label: "Distance from Earth", value: "38 million km from Earth" },
      { label: "Type", value: "Terrestrial planet" },
      { label: "Constellation", value: "Varies (planet)" },
      { label: "Diameter", value: "12,104 km" },
      { label: "Discovered", value: "Known since ancient times" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "Ancient", event: "Venus was recorded by ancient civilizations." },
      { year: "1962", event: "Mariner 2 became the first spacecraft to fly by Venus." },
      { year: "1990", event: "Magellan mapped much of Venus using radar." },
      { year: "Today", event: "Venus is studied to understand greenhouse climates." },
    ],
    notes: [
      "Venus rotates in the opposite direction to most planets.",
      "Its thick atmosphere traps heat very efficiently.",
      "Surface pressure on Venus is far greater than on Earth.",
      "The planet is often called Earth's sister planet because of its similar size.",
    ],
    features: [
      "Dense carbon dioxide atmosphere",
      "Extreme greenhouse effect",
      "Brightest planet in Earth's night sky",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  earth: {
    name: "Earth",
    type: "Terrestrial planet",
    distance: "0 km (home planet)",
    discovery: "Known since ancient times",
    analysis:
      "Earth is the only known planet confirmed to support life. It has liquid water on the surface, a protective atmosphere, and a dynamic climate and geology.",
    properties: [
      { label: "Distance from Earth", value: "0 km (home planet)" },
      { label: "Type", value: "Terrestrial planet" },
      { label: "Constellation", value: "Not applicable" },
      { label: "Diameter", value: "12,742 km" },
      { label: "Discovered", value: "Known since ancient times" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "Ancient", event: "Earth has been observed by humans since the beginning of civilization." },
      { year: "1543", event: "Copernicus helped place Earth in a heliocentric Solar System." },
      { year: "1961", event: "Humans first viewed Earth from space." },
      { year: "Today", event: "Earth is continuously monitored by satellites and observatories." },
    ],
    notes: [
      "Earth is the only known world with stable surface liquid water and life.",
      "Its atmosphere protects the surface and regulates temperature.",
      "About 71% of Earth's surface is covered by oceans.",
      "Plate tectonics and a magnetic field help shape and protect the planet.",
    ],
    features: [
      "Only known planet with life",
      "Surface covered largely by oceans",
      "Protected by atmosphere and magnetic field",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  moon: {
    name: "Moon",
    type: "Natural satellite",
    distance: "384,400 km from Earth",
    discovery: "Known since ancient times",
    analysis:
      "The Moon is Earth's natural satellite. It strongly influences tides on Earth and is the most visited world beyond our planet.",
    properties: [
      { label: "Distance from Earth", value: "384,400 km from Earth" },
      { label: "Type", value: "Natural satellite" },
      { label: "Constellation", value: "Not applicable" },
      { label: "Diameter", value: "3,474 km" },
      { label: "Discovered", value: "Known since ancient times" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "Ancient", event: "The Moon was studied and tracked by early civilizations." },
      { year: "1609", event: "Galileo used a telescope to observe lunar mountains and craters." },
      { year: "1969", event: "Apollo 11 landed the first humans on the Moon." },
      { year: "Today", event: "The Moon remains a key target for exploration and research." },
    ],
    notes: [
      "The Moon is Earth's only natural satellite.",
      "Its gravity plays a major role in ocean tides.",
      "The near side contains large dark volcanic plains called maria.",
      "It is central to many present and future space missions.",
    ],
    features: [
      "Earth's natural satellite",
      "Drives ocean tides",
      "Visited by multiple human missions",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  mars: {
    name: "Mars",
    type: "Terrestrial planet",
    distance: "225 million km from Earth",
    discovery: "Known since ancient times",
    analysis:
      "Mars is the fourth planet from the Sun and is often called the Red Planet because of iron oxide on its surface. It is one of the main targets in the search for past habitability beyond Earth.",
    properties: [
      { label: "Distance from Earth", value: "225 million km from Earth" },
      { label: "Type", value: "Terrestrial planet" },
      { label: "Constellation", value: "Varies (planet)" },
      { label: "Diameter", value: "6,779 km" },
      { label: "Discovered", value: "Known since ancient times" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "Ancient", event: "Mars was recorded by ancient astronomers." },
      { year: "1877", event: "Its moons Phobos and Deimos were discovered." },
      { year: "1976", event: "Viking missions landed on Mars and studied its surface." },
      { year: "Today", event: "Rovers and orbiters continue exploring Mars for signs of past habitability." },
    ],
    notes: [
      "Mars is known as the Red Planet because of iron oxide dust on its surface.",
      "It has two small moons named Phobos and Deimos.",
      "Olympus Mons on Mars is the tallest volcano in the Solar System.",
      "Mars is a major focus of robotic exploration and future human missions.",
    ],
    features: [
      "Known as the Red Planet",
      "Home to Olympus Mons",
      "Target in the search for past life and habitability",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  jupiter: {
    name: "Jupiter",
    type: "Gas giant",
    distance: "588 million km from Earth",
    discovery: "Known since ancient times",
    analysis:
      "Jupiter is the largest planet in the Solar System. It is a gas giant famous for its Great Red Spot and its large family of moons.",
    properties: [
      { label: "Distance from Earth", value: "588 million km from Earth" },
      { label: "Type", value: "Gas giant" },
      { label: "Constellation", value: "Varies (planet)" },
      { label: "Diameter", value: "139,820 km" },
      { label: "Discovered", value: "Known since ancient times" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "Ancient", event: "Jupiter was known to ancient sky observers." },
      { year: "1610", event: "Galileo discovered four major Jovian moons." },
      { year: "1979", event: "Voyager missions returned detailed images of Jupiter." },
      { year: "Today", event: "Jupiter is studied for its atmosphere, magnetosphere, and moons." },
    ],
    notes: [
      "Jupiter is the largest planet in the Solar System.",
      "The Great Red Spot is a giant storm that has lasted for centuries.",
      "Its major moons include Io, Europa, Ganymede, and Callisto.",
      "Jupiter has a very strong magnetic field and intense radiation belts.",
    ],
    features: [
      "Largest planet in the Solar System",
      "Famous for the Great Red Spot",
      "Has many moons including Europa and Ganymede",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  saturn: {
    name: "Saturn",
    type: "Gas giant",
    distance: "1.2 billion km from Earth",
    discovery: "Known since ancient times",
    analysis:
      "Saturn is a gas giant best known for its bright ring system. It is a major outer-planet world with many moons, including Titan.",
    properties: [
      { label: "Distance from Earth", value: "1.2 billion km from Earth" },
      { label: "Type", value: "Gas giant" },
      { label: "Constellation", value: "Varies (planet)" },
      { label: "Diameter", value: "116,460 km" },
      { label: "Discovered", value: "Known since ancient times" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "Ancient", event: "Saturn was observed long before telescopes existed." },
      { year: "1610", event: "Galileo observed Saturn through a telescope." },
      { year: "2004", event: "Cassini began its close study of Saturn and its moons." },
      { year: "Today", event: "Saturn remains central to ring and moon research." },
    ],
    notes: [
      "Saturn is famous for its beautiful ring system.",
      "It has many moons, including Titan and Enceladus.",
      "Its average density is lower than water.",
      "Saturn is a gas giant with a deep, dynamic atmosphere.",
    ],
    features: [
      "Bright and extensive ring system",
      "Many moons including Titan",
      "Gas giant with low average density",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  uranus: {
    name: "Uranus",
    type: "Ice giant",
    distance: "2.6 billion km from Earth",
    discovery: "Discovered in 1781",
    analysis:
      "Uranus is an ice giant with a unique sideways tilt. Its atmosphere contains methane, which gives the planet its blue-green appearance.",
    properties: [
      { label: "Distance from Earth", value: "2.6 billion km from Earth" },
      { label: "Type", value: "Ice giant" },
      { label: "Constellation", value: "Varies (planet)" },
      { label: "Diameter", value: "50,724 km" },
      { label: "Discovered", value: "Discovered in 1781" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "1781", event: "William Herschel discovered Uranus." },
      { year: "1986", event: "Voyager 2 flew past Uranus and studied the planet up close." },
      { year: "Modern", event: "Uranus became important in the study of ice giants." },
      { year: "Today", event: "Researchers continue planning future missions to Uranus." },
    ],
    notes: [
      "Uranus rotates on its side compared with most planets.",
      "Methane in its atmosphere gives it a blue-green color.",
      "It has rings and many moons.",
      "Uranus is classified as an ice giant rather than a gas giant.",
    ],
    features: [
      "Rotates with an extreme axial tilt",
      "Blue-green color from methane",
      "Classified as an ice giant",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  neptune: {
    name: "Neptune",
    type: "Ice giant",
    distance: "4.3 billion km from Earth",
    discovery: "Discovered in 1846",
    analysis:
      "Neptune is the farthest major planet from the Sun. It is an ice giant known for strong winds, deep blue color, and the moon Triton.",
    properties: [
      { label: "Distance from Earth", value: "4.3 billion km from Earth" },
      { label: "Type", value: "Ice giant" },
      { label: "Constellation", value: "Varies (planet)" },
      { label: "Diameter", value: "49,244 km" },
      { label: "Discovered", value: "Discovered in 1846" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "1846", event: "Neptune was discovered through mathematical prediction and observation." },
      { year: "1989", event: "Voyager 2 made the first and only close flyby of Neptune." },
      { year: "Modern", event: "Scientists studied Neptune's fast-moving weather systems." },
      { year: "Today", event: "Neptune remains a key target for outer Solar System science." },
    ],
    notes: [
      "Neptune is the farthest major planet from the Sun.",
      "It has very fast winds and active weather systems.",
      "Its largest moon, Triton, orbits in the opposite direction to the planet's rotation.",
      "Neptune is an ice giant rich in volatile compounds.",
    ],
    features: [
      "Farthest major planet from the Sun",
      "Very strong atmospheric winds",
      "Has the retrograde moon Triton",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  pluto: {
    name: "Pluto",
    type: "Dwarf planet",
    distance: "5.0 billion km from Earth",
    discovery: "Discovered in 1930",
    analysis:
      "Pluto is a dwarf planet in the Kuiper Belt. It is famous for its complex icy surface and the large companion moon Charon.",
    properties: [
      { label: "Distance from Earth", value: "5.0 billion km from Earth" },
      { label: "Type", value: "Dwarf planet" },
      { label: "Constellation", value: "Varies (planet)" },
      { label: "Diameter", value: "2,377 km" },
      { label: "Discovered", value: "Discovered in 1930" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "1930", event: "Clyde Tombaugh discovered Pluto." },
      { year: "2006", event: "Pluto was reclassified as a dwarf planet." },
      { year: "2015", event: "New Horizons flew by Pluto and revealed detailed surface features." },
      { year: "Today", event: "Pluto remains one of the most studied Kuiper Belt objects." },
    ],
    notes: [
      "Pluto is a dwarf planet in the Kuiper Belt.",
      "Its bright heart-shaped region is called Tombaugh Regio.",
      "Charon is so large compared with Pluto that the pair is often described as a binary system.",
      "New Horizons transformed our view of Pluto in 2015.",
    ],
    features: [
      "Dwarf planet in the Kuiper Belt",
      "Known for Tombaugh Regio",
      "Orbited by the large moon Charon",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  "black hole": {
    name: "Black Hole",
    type: "Compact object",
    distance: "Varies by object",
    discovery: "Predicted in the 20th century",
    analysis:
      "A black hole is a region of space where gravity is so strong that not even light can escape. Black holes are studied through their effects on nearby matter, stars, and radiation.",
    properties: [
      { label: "Distance from Earth", value: "Varies by object" },
      { label: "Type", value: "Compact object" },
      { label: "Constellation", value: "Varies by object" },
      { label: "Diameter", value: "Depends on mass" },
      { label: "Discovered", value: "Predicted in the 20th century" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "1916", event: "Solutions to Einstein's equations suggested extremely compact objects." },
      { year: "1970s", event: "Black holes became widely accepted in astrophysics." },
      { year: "2019", event: "The Event Horizon Telescope released the first black hole image." },
      { year: "Today", event: "Black holes are studied using light, motion, and gravitational waves." },
    ],
    notes: [
      "Black holes can form when massive stars collapse.",
      "Supermassive black holes are found at the centers of many galaxies.",
      "Scientists infer their presence from the behavior of nearby matter and stars.",
      "The event horizon marks the boundary beyond which escape is impossible.",
    ],
    features: [
      "Gravity strong enough to trap light",
      "Studied through surrounding matter and motion",
      "Can be stellar-mass or supermassive",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  blackhole: {
    name: "Black Hole",
    type: "Compact object",
    distance: "Varies by object",
    discovery: "Predicted in the 20th century",
    analysis:
      "A black hole is a region of space where gravity is so strong that not even light can escape. Black holes are studied through their effects on nearby matter, stars, and radiation.",
    properties: [
      { label: "Distance from Earth", value: "Varies by object" },
      { label: "Type", value: "Compact object" },
      { label: "Constellation", value: "Varies by object" },
      { label: "Diameter", value: "Depends on mass" },
      { label: "Discovered", value: "Predicted in the 20th century" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "1916", event: "Solutions to Einstein's equations suggested extremely compact objects." },
      { year: "1970s", event: "Black holes became widely accepted in astrophysics." },
      { year: "2019", event: "The Event Horizon Telescope released the first black hole image." },
      { year: "Today", event: "Black holes are studied using light, motion, and gravitational waves." },
    ],
    notes: [
      "Black holes can form when massive stars collapse.",
      "Supermassive black holes are found at the centers of many galaxies.",
      "Scientists infer their presence from the behavior of nearby matter and stars.",
      "The event horizon marks the boundary beyond which escape is impossible.",
    ],
    features: [
      "Gravity strong enough to trap light",
      "Studied through surrounding matter and motion",
      "Can be stellar-mass or supermassive",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  nebula: {
    name: "Nebula",
    type: "Interstellar cloud",
    distance: "Varies by object",
    discovery: "Observed since early telescopic astronomy",
    analysis:
      "A nebula is a giant cloud of gas and dust in space. Some nebulae are star-forming regions, while others are produced by dying stars and supernova explosions.",
    properties: [
      { label: "Distance from Earth", value: "Varies by object" },
      { label: "Type", value: "Interstellar cloud" },
      { label: "Constellation", value: "Varies by object" },
      { label: "Diameter", value: "Varies widely" },
      { label: "Discovered", value: "Observed since early telescopic astronomy" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "1610", event: "Early telescopes revealed fuzzy deep-sky clouds later studied as nebulae." },
      { year: "19th c.", event: "Astronomers began classifying different nebula types." },
      { year: "20th c.", event: "Spectroscopy revealed the gas and dust composition of nebulae." },
      { year: "Today", event: "Nebulae are studied as star nurseries and remnants of stellar evolution." },
    ],
    notes: [
      "Nebulae are made mostly of gas and dust.",
      "Emission nebulae glow because nearby stars energize the gas.",
      "Planetary nebulae form when some stars shed their outer layers.",
      "Some nebulae are regions where new stars are born.",
    ],
    features: [
      "Large clouds of gas and dust",
      "Can form stars or result from dying stars",
      "Often observed in colorful emission and reflection light",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  "milky way": {
    name: "Milky Way",
    type: "Spiral Galaxy",
    distance: "0 light-years (home galaxy)",
    discovery: "Known since ancient times",
    analysis:
      "The Milky Way is the spiral galaxy that contains our Solar System. It includes billions of stars, interstellar gas, dust, and a supermassive black hole at its center.",
    properties: [
      { label: "Distance from Earth", value: "0 light-years (home galaxy)" },
      { label: "Type", value: "Spiral Galaxy" },
      { label: "Constellation", value: "Not applicable" },
      { label: "Diameter", value: "About 100,000 light-years" },
      { label: "Discovered", value: "Known since ancient times" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "Ancient", event: "The Milky Way was observed as a bright band across the night sky." },
      { year: "1610", event: "Galileo showed that the Milky Way is made of countless stars." },
      { year: "20th c.", event: "Astronomers mapped its spiral structure and galactic center." },
      { year: "Today", event: "The Milky Way is studied across radio, infrared, optical, and X-ray wavelengths." },
    ],
    notes: [
      "The Milky Way contains billions of stars.",
      "A supermassive black hole lies at its center.",
      "Our Solar System is located in one of its spiral arms.",
      "It is one of many galaxies in the observable universe.",
    ],
    features: [
      "Contains billions of stars",
      "Has a central supermassive black hole",
      "Includes the Solar System",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  andromeda: {
    name: "Andromeda Galaxy",
    type: "Spiral Galaxy",
    distance: "2.5 million light-years",
    discovery: "Observed by Abd al-Rahman al-Sufi in 964 AD",
    analysis:
      "The Andromeda Galaxy is the nearest large galaxy to the Milky Way. It contains over one trillion stars and is expected to interact with the Milky Way in the far future.",
    properties: [
      { label: "Distance from Earth", value: "2.5 million light-years" },
      { label: "Type", value: "Spiral Galaxy" },
      { label: "Constellation", value: "Andromeda" },
      { label: "Diameter", value: "About 220,000 light-years" },
      { label: "Discovered", value: "Observed by Abd al-Rahman al-Sufi in 964 AD" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "964", event: "Abd al-Rahman al-Sufi recorded the Andromeda Galaxy." },
      { year: "1920s", event: "Edwin Hubble proved Andromeda lies beyond the Milky Way." },
      { year: "Modern", event: "Detailed observations revealed its spiral structure and stellar populations." },
      { year: "Future", event: "Andromeda is expected to merge with the Milky Way in billions of years." },
    ],
    notes: [
      "Andromeda is the nearest large galaxy to the Milky Way.",
      "It contains over one trillion stars.",
      "It is visible to the naked eye under dark skies.",
      "It will eventually interact gravitationally with the Milky Way.",
    ],
    features: [
      "Nearest large galaxy to the Milky Way",
      "Contains over one trillion stars",
      "Will collide with the Milky Way in billions of years",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  "andromeda galaxy": {
    name: "Andromeda Galaxy",
    type: "Spiral Galaxy",
    distance: "2.5 million light-years",
    discovery: "Observed by Abd al-Rahman al-Sufi in 964 AD",
    analysis:
      "The Andromeda Galaxy is the nearest large galaxy to the Milky Way. It contains over one trillion stars and is expected to interact with the Milky Way in the far future.",
    properties: [
      { label: "Distance from Earth", value: "2.5 million light-years" },
      { label: "Type", value: "Spiral Galaxy" },
      { label: "Constellation", value: "Andromeda" },
      { label: "Diameter", value: "About 220,000 light-years" },
      { label: "Discovered", value: "Observed by Abd al-Rahman al-Sufi in 964 AD" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "964", event: "Abd al-Rahman al-Sufi recorded the Andromeda Galaxy." },
      { year: "1920s", event: "Edwin Hubble proved Andromeda lies beyond the Milky Way." },
      { year: "Modern", event: "Detailed observations revealed its spiral structure and stellar populations." },
      { year: "Future", event: "Andromeda is expected to merge with the Milky Way in billions of years." },
    ],
    notes: [
      "Andromeda is the nearest large galaxy to the Milky Way.",
      "It contains over one trillion stars.",
      "It is visible to the naked eye under dark skies.",
      "It will eventually interact gravitationally with the Milky Way.",
    ],
    features: [
      "Nearest large galaxy to the Milky Way",
      "Contains over one trillion stars",
      "Will collide with the Milky Way in billions of years",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
  "orion nebula": {
    name: "Orion Nebula",
    type: "Diffuse Nebula",
    distance: "1,344 light-years",
    discovery: "Recorded by Nicolas-Claude Fabri de Peiresc in 1610",
    analysis:
      "The Orion Nebula is one of the brightest and best-known nebulae in the night sky. It is an active star-forming region and a major target for both amateur and professional astronomy.",
    properties: [
      { label: "Distance from Earth", value: "1,344 light-years" },
      { label: "Type", value: "Diffuse Nebula" },
      { label: "Constellation", value: "Orion" },
      { label: "Diameter", value: "About 24 light-years" },
      { label: "Discovered", value: "Recorded by Nicolas-Claude Fabri de Peiresc in 1610" },
      { label: "Agency", value: "CosmoLens local fallback" },
    ],
    timeline: [
      { year: "1610", event: "The Orion Nebula was recorded in early telescopic astronomy." },
      { year: "19th c.", event: "It became a key object for nebula and spectroscopy studies." },
      { year: "Modern", event: "Space telescopes revealed detailed star-forming structures inside it." },
      { year: "Today", event: "The Orion Nebula remains one of the most studied stellar nurseries." },
    ],
    notes: [
      "The Orion Nebula is a region of active star formation.",
      "It is visible to the naked eye under dark skies.",
      "It is one of the brightest nebulae in the sky.",
      "Young stars and glowing gas make it a classic nebula target.",
    ],
    features: [
      "Region of active star formation",
      "Visible to the naked eye",
      "One of the brightest nebulae in the sky",
    ],
    image_url: null,
    source: null,
    nasa_id: null,
  },
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

function getLocalExplorerObject(name: string): ExplorerObject | undefined {
  return localExplorerObjects[name.trim().toLowerCase()]
}

export async function fetchLiveExplorerObject(name: string): Promise<ExplorerLookupResult> {
  const fallbackObject = getLocalExplorerObject(name)

  try {
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

    if (found) {
      return {
        found: true,
        object,
        message: typeof payload.message === "string" ? payload.message : undefined,
      }
    }

    if (fallbackObject) {
      return {
        found: true,
        object: fallbackObject,
        message: "Loaded from local explorer fallback data.",
      }
    }

    return {
      found: false,
      message: `No results found for '${name}'. Try searching for a known space object like 'Mars', 'Sun', 'Andromeda Galaxy', or 'Black Hole'.`,
    }
  } catch (error) {
    if (fallbackObject) {
      return {
        found: true,
        object: fallbackObject,
        message: "Backend unavailable. Loaded local explorer fallback data instead.",
      }
    }

    const message =
      error instanceof Error ? error.message : "Explorer object lookup failed."

    return {
      found: false,
      message,
    }
  }
}
