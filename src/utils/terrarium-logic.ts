import {
  LightingData,
  WeatherType,
  TerrariumBiome,
  FloraSpeciesInfo,
  PlacedFlora,
} from '../types/terrarium';

export const SPECIES_CATALOG: Record<string, FloraSpeciesInfo> = {
  maidenhair: {
    id: 'maidenhair',
    name: 'Maidenhair Fern',
    scientificName: 'Adiantum raddianum',
    category: 'fern',
    description: 'Delicate fan-shaped fronds that thrive in high-humidity enclosed micro-climates.',
    lightPreference: 'Dappled Indirect',
    humidityNeed: 'High (80%+)',
  },
  echeveria: {
    id: 'echeveria',
    name: 'Opaline Echeveria',
    scientificName: 'Echeveria elegans',
    category: 'succulent',
    description: 'Geometric spiraling rosette with fleshy powder-blue leaves tipped with soft coral pink.',
    lightPreference: 'Bright Sun',
    humidityNeed: 'Low to Moderate',
  },
  bonsai: {
    id: 'bonsai',
    name: 'Dwarf Juniper Bonsai',
    scientificName: 'Juniperus procumbens',
    category: 'bonsai',
    description: 'Artfully sculpted ancient dwarf pine with rugged bark and vibrant tiered needle clusters.',
    lightPreference: 'Moderate Sunlight',
    humidityNeed: 'Moderate (60%)',
  },
  biolum_mushroom: {
    id: 'biolum_mushroom',
    name: 'Ghost Ghostling Fungus',
    scientificName: 'Mycena chlorophos',
    category: 'mushroom',
    description: 'Luminous forest caps emitting a magical soft teal glow in the dark of night.',
    lightPreference: 'Low / Shade',
    humidityNeed: 'High (85%+)',
  },
  cushion_moss: {
    id: 'cushion_moss',
    name: 'Velvet Cushion Moss',
    scientificName: 'Leucobryum glaucum',
    category: 'moss',
    description: 'Dense dome-forming emerald moss carpeting soil mounds and hugging weathered river stone.',
    lightPreference: 'Filtered Light',
    humidityNeed: 'Constant Moisture',
  },
  bellflower: {
    id: 'bellflower',
    name: 'Alpine Bellflower',
    scientificName: 'Campanula cochleariifolia',
    category: 'flower',
    description: 'Small nodding blossoms with azure-lilac petals that unfurl gently with ambient warmth.',
    lightPreference: 'Morning Sun',
    humidityNeed: 'Moderate (65%)',
  },
};

/**
 * Normalizes hour to [0, 24)
 */
export function normalizeHour(hour: number): number {
  let h = hour % 24;
  if (h < 0) h += 24;
  return h;
}

/**
 * Formats fractional hour (e.g. 14.5 -> "02:30 PM")
 */
export function formatTimeOfDay(hour: number): string {
  const norm = normalizeHour(hour);
  const totalMinutes = Math.floor(norm * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const padM = m < 10 ? `0${m}` : `${m}`;
  return `${displayH}:${padM} ${period}`;
}

/**
 * Simple pseudo-random number generator for deterministic seeds
 */
export function seededRandom(seed: number): () => number {
  let s = Math.abs(seed) % 2147483647;
  if (s === 0) s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Interpolates lighting parameters smoothly across the 24h cycle
 */
export function calculateLighting(hour: number, weather: WeatherType): LightingData {
  const h = normalizeHour(hour);
  
  // Calculate sun orbital angle
  // 6:00 = Sunrise (0 rad), 12:00 = Solar noon (PI/2), 18:00 = Sunset (PI), 0:00 = Midnight (3*PI/2)
  const angle = ((h - 6) / 24) * Math.PI * 2;
  const sunElevation = Math.sin(angle);
  const sunAzimuth = Math.cos(angle);
  
  // Sun 3D position (radius 18)
  const sunX = sunAzimuth * 14;
  const sunY = Math.max(-5, sunElevation * 15);
  const sunZ = Math.sin(angle * 0.5) * 8 + 4;
  
  // Base day/night factors
  const isDay = sunElevation > 0;
  const twilightFactor = Math.max(0, 1 - Math.abs(sunElevation) * 3); // near horizon
  const nightFactor = Math.max(0, -sunElevation);
  
  // Weather modifications
  const isRain = weather === 'rain';
  const isMist = weather === 'mist';
  
  let sunIntensity = 0;
  let sunColor = '#fff5e6';
  let fogColor = '#8baac4';
  let fogDensity = 0.015;
  let hemiSkyColor = '#b3d8fd';
  let hemiGroundColor = '#3f4f3c';
  let hemiIntensity = 0.6;
  let starsOpacity = 0;
  let moonIntensity = 0;
  let biolumIntensity = 0;
  let skyGradientTop = '#4a90e2';
  let skyGradientBottom = '#d6e9fe';

  if (h >= 5 && h < 8) {
    // Dawn / Sunrise
    const t = (h - 5) / 3;
    sunIntensity = 1.2 * t;
    sunColor = '#ffaa66';
    fogColor = '#d9a088';
    fogDensity = 0.022;
    hemiSkyColor = '#f3b89f';
    hemiGroundColor = '#2b3329';
    hemiIntensity = 0.55;
    starsOpacity = Math.max(0, 1 - t * 1.5);
    skyGradientTop = '#2c3e50';
    skyGradientBottom = '#ff8c69';
    biolumIntensity = Math.max(0, 0.4 - t * 0.4);
  } else if (h >= 8 && h < 17) {
    // Broad Daylight
    sunIntensity = 2.0;
    sunColor = '#fffaf0';
    fogColor = '#cbe4f9';
    fogDensity = 0.012;
    hemiSkyColor = '#d9ecff';
    hemiGroundColor = '#3e4d36';
    hemiIntensity = 0.85;
    starsOpacity = 0;
    skyGradientTop = '#3486db';
    skyGradientBottom = '#e0f0ff';
    biolumIntensity = 0;
  } else if (h >= 17 && h < 20.5) {
    // Golden Hour / Sunset
    const t = (h - 17) / 3.5;
    sunIntensity = Math.max(0.2, 1.8 * (1 - t * 0.7));
    sunColor = '#ff7b47';
    fogColor = '#80485b';
    fogDensity = 0.024;
    hemiSkyColor = '#c06c84';
    hemiGroundColor = '#352d39';
    hemiIntensity = 0.6;
    starsOpacity = Math.max(0, (t - 0.5) * 1.5);
    skyGradientTop = '#351f39';
    skyGradientBottom = '#ff7256';
    biolumIntensity = Math.max(0, t * 0.6);
  } else {
    // Night / Twilight
    sunIntensity = 0.05;
    sunColor = '#4a6b82';
    fogColor = '#0b1320';
    fogDensity = 0.026;
    hemiSkyColor = '#1a273b';
    hemiGroundColor = '#0a1017';
    hemiIntensity = 0.35;
    starsOpacity = 0.95;
    moonIntensity = 0.8;
    biolumIntensity = 1.0;
    skyGradientTop = '#060a12';
    skyGradientBottom = '#131e2e';
  }

  // Adjust for weather
  if (isRain) {
    sunIntensity *= 0.35;
    hemiIntensity *= 0.6;
    fogDensity = Math.max(fogDensity, 0.035);
    fogColor = '#3a4b58';
  } else if (isMist) {
    sunIntensity *= 0.65;
    fogDensity = Math.max(fogDensity, 0.045);
  }

  return {
    sunColor,
    sunIntensity,
    sunPosition: [sunX, sunY, sunZ],
    hemiSkyColor,
    hemiGroundColor,
    hemiIntensity,
    fogColor,
    fogDensity,
    skyGradientTop,
    skyGradientBottom,
    starsOpacity,
    moonIntensity,
    biolumIntensity,
  };
}

/**
 * Returns weather preset defaults for controls
 */
export function getWeatherPresetDefaults(weather: WeatherType) {
  switch (weather) {
    case 'rain':
      return { rainIntensity: 0.8, mistDensity: 0.3, condensation: 0.85, windSpeed: 0.4 };
    case 'mist':
      return { rainIntensity: 0.0, mistDensity: 0.9, condensation: 0.6, windSpeed: 0.15 };
    case 'fireflies':
      return { rainIntensity: 0.0, mistDensity: 0.15, condensation: 0.2, windSpeed: 0.1 };
    case 'sunbeams':
      return { rainIntensity: 0.0, mistDensity: 0.25, condensation: 0.1, windSpeed: 0.2 };
    case 'clear':
    default:
      return { rainIntensity: 0.0, mistDensity: 0.05, condensation: 0.15, windSpeed: 0.25 };
  }
}

/**
 * Generates procedural flora placement tailored to biome & seed
 */
export function generateFloraLayout(
  biome: TerrariumBiome,
  seed: number,
  density: number = 1.0
): PlacedFlora[] {
  const rng = seededRandom(seed);
  const items: PlacedFlora[] = [];
  const maxRadius = 1.85; // terrarium base inner usable radius

  // Pick primary species based on biome
  let heroSpeciesId: string;
  let secondarySpeciesId: string;
  let accentSpeciesId: string;

  switch (biome) {
    case 'rainforest':
      heroSpeciesId = 'bonsai';
      secondarySpeciesId = 'maidenhair';
      accentSpeciesId = 'biolum_mushroom';
      break;
    case 'succulent':
      heroSpeciesId = 'echeveria';
      secondarySpeciesId = 'bellflower';
      accentSpeciesId = 'echeveria';
      break;
    case 'twilight':
      heroSpeciesId = 'biolum_mushroom';
      secondarySpeciesId = 'maidenhair';
      accentSpeciesId = 'biolum_mushroom';
      break;
    case 'zen':
    default:
      heroSpeciesId = 'bonsai';
      secondarySpeciesId = 'cushion_moss';
      accentSpeciesId = 'bellflower';
      break;
  }

  // 1. Hero Subject (slight offset for artistic asymmetry)
  const heroAngle = rng() * Math.PI * 2;
  const heroDist = 0.25 + rng() * 0.35;
  items.push({
    id: `hero-${seed}-1`,
    species: SPECIES_CATALOG[heroSpeciesId],
    position: [Math.cos(heroAngle) * heroDist, 0.02, Math.sin(heroAngle) * heroDist],
    rotation: [0, rng() * Math.PI * 2, (rng() - 0.5) * 0.1],
    scale: 1.1 + rng() * 0.2,
  });

  // 2. Secondary Flora Clusters
  const secondaryCount = Math.round((3 + rng() * 3) * density);
  for (let i = 0; i < secondaryCount; i++) {
    const angle = (i / secondaryCount) * Math.PI * 2 + (rng() - 0.5) * 0.5;
    const dist = 0.7 + rng() * 0.9;
    if (dist > maxRadius) continue;
    
    // Choose between secondary and other variety
    const speciesId = rng() > 0.3 ? secondarySpeciesId : 'bellflower';
    items.push({
      id: `sec-${seed}-${i}`,
      species: SPECIES_CATALOG[speciesId] || SPECIES_CATALOG['maidenhair'],
      position: [Math.cos(angle) * dist, 0.02, Math.sin(angle) * dist],
      rotation: [(rng() - 0.5) * 0.15, rng() * Math.PI * 2, (rng() - 0.5) * 0.15],
      scale: 0.75 + rng() * 0.35,
    });
  }

  // 3. Accent & Bioluminescent Mushrooms / Blossoms
  const accentCount = Math.round((2 + rng() * 3) * density);
  for (let i = 0; i < accentCount; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 0.5 + rng() * 1.1;
    if (dist > maxRadius) continue;

    items.push({
      id: `acc-${seed}-${i}`,
      species: SPECIES_CATALOG[accentSpeciesId] || SPECIES_CATALOG['cushion_moss'],
      position: [Math.cos(angle) * dist, 0.02, Math.sin(angle) * dist],
      rotation: [0, rng() * Math.PI * 2, (rng() - 0.5) * 0.2],
      scale: 0.6 + rng() * 0.4,
    });
  }

  return items;
}
