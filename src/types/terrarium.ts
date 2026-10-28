export type TimeOfDayPreset = 'dawn' | 'day' | 'sunset' | 'night';

export type WeatherType = 'clear' | 'rain' | 'mist' | 'fireflies' | 'sunbeams';

export type TerrariumBiome = 'rainforest' | 'succulent' | 'zen' | 'twilight';

export type CameraPreset = 'orbit' | 'macro' | 'zenith' | 'front';

export interface FloraSpeciesInfo {
  id: string;
  name: string;
  scientificName: string;
  category: 'fern' | 'succulent' | 'bonsai' | 'mushroom' | 'flower' | 'moss';
  description: string;
  lightPreference: string;
  humidityNeed: string;
}

export interface PlacedFlora {
  id: string;
  species: FloraSpeciesInfo;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface TerrariumState {
  // Time and Light
  timeOfDay: number; // 0 to 24 (hours)
  autoCycle: boolean;
  cycleSpeed: number; // multiplier (e.g. 1 = normal, 5 = fast)
  
  // Weather & Atmosphere
  weather: WeatherType;
  rainIntensity: number; // 0 to 1
  mistDensity: number; // 0 to 1
  condensation: number; // 0 to 1
  windSpeed: number; // 0 to 1
  
  // Biome & Terrarium Config
  biome: TerrariumBiome;
  floraDensity: number; // 0.5 to 1.5
  biomeSeed: number;
  lidOpen: boolean;
  glassOpacity: number; // 0 to 1
  showSoilLayers: boolean;
  
  // Audio
  soundMuted: boolean;
  soundVolume: number; // 0 to 1
  chimeActive: boolean;
  
  // Camera & Interaction
  cameraPreset: CameraPreset;
  selectedFlora: PlacedFlora | null;
  zenMode: boolean; // hide UI
}

export interface LightingData {
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  fogColor: string;
  fogDensity: number;
  skyGradientTop: string;
  skyGradientBottom: string;
  starsOpacity: number;
  moonIntensity: number;
  biolumIntensity: number;
}
