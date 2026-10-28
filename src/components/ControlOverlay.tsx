import React, { useState } from 'react';
import {
  Sun,
  Moon,
  CloudRain,
  CloudFog,
  Sparkles,
  Volume2,
  VolumeX,
  Camera,
  Maximize2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wind,
  Droplets,
  Eye,
  Sliders,
  Flower2,
  Compass,
  Bell,
  Play,
  Pause,
  X,
} from 'lucide-react';
import {
  TerrariumState,
  WeatherType,
  TerrariumBiome,
  CameraPreset,
  PlacedFlora,
} from '../types/terrarium';
import { formatTimeOfDay, getWeatherPresetDefaults } from '../utils/terrarium-logic';
import { soundscape } from '../audio/soundscape';

interface ControlOverlayProps {
  state: TerrariumState;
  onChange: (updater: (prev: TerrariumState) => TerrariumState) => void;
  onCameraChange: (preset: CameraPreset) => void;
  onReseed: () => void;
  onCaptureScreenshot: () => void;
  selectedFlora: PlacedFlora | null;
  onCloseFloraCard: () => void;
}

type TabType = 'time' | 'weather' | 'biome' | 'sound';

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  state,
  onChange,
  onCameraChange,
  onReseed,
  onCaptureScreenshot,
  selectedFlora,
  onCloseFloraCard,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('time');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Time presets
  const setPresetTime = (hour: number) => {
    onChange(prev => ({
      ...prev,
      timeOfDay: hour,
      autoCycle: false,
    }));
  };

  // Weather presets
  const setWeather = (weather: WeatherType) => {
    const defaults = getWeatherPresetDefaults(weather);
    onChange(prev => ({
      ...prev,
      weather,
      ...defaults,
    }));
  };

  // Sound toggle
  const toggleMute = () => {
    const nextMuted = !state.soundMuted;
    soundscape.setMuted(nextMuted);
    onChange(prev => ({ ...prev, soundMuted: nextMuted }));
  };

  const handleVolumeChange = (vol: number) => {
    soundscape.setVolume(vol);
    if (state.soundMuted && vol > 0) {
      soundscape.setMuted(false);
    }
    onChange(prev => ({
      ...prev,
      soundVolume: vol,
      soundMuted: vol === 0,
    }));
  };

  const playChime = () => {
    soundscape.playSingingBowlChime(528);
  };

  return (
    <>
      {/* 1. Top Minimal Header & Status Bar */}
      <header className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between pointer-events-none select-none z-20">
        <div className="flex items-center gap-2 sm:gap-3 bg-[rgba(15,23,32,0.88)] border border-[rgba(255,255,255,0.1)] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-slate-100 pointer-events-auto shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
          <h1 className="text-xs sm:text-sm font-semibold tracking-wider text-emerald-300 uppercase">
            Aetheria
          </h1>
          <span className="hidden sm:inline text-xs text-slate-400 border-l border-slate-700 pl-3">
            3D Living Terrarium
          </span>
          <span className="text-xs font-mono px-1.5 sm:px-2 py-0.5 rounded bg-[rgba(255,255,255,0.08)] text-slate-300">
            {formatTimeOfDay(state.timeOfDay)}
          </span>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <button
            onClick={() => onCameraChange('orbit')}
            title="Reset Orbit View"
            aria-label="Reset Camera Orbit"
            className="p-2 sm:p-2.5 bg-[rgba(15,23,32,0.88)] hover:bg-[rgba(28,42,58,0.95)] text-slate-200 border border-[rgba(255,255,255,0.1)] rounded-xl transition shadow-lg"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={onCaptureScreenshot}
            title="Capture Screenshot"
            aria-label="Capture High-Res Terrarium Screenshot"
            className="p-2 sm:p-2.5 bg-[rgba(15,23,32,0.88)] hover:bg-[rgba(28,42,58,0.95)] text-slate-200 border border-[rgba(255,255,255,0.1)] rounded-xl transition shadow-lg"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMute}
            title={state.soundMuted ? 'Unmute Soundscape' : 'Mute Soundscape'}
            aria-label={state.soundMuted ? 'Unmute procedural soundscape' : 'Mute procedural soundscape'}
            className="p-2 sm:p-2.5 bg-[rgba(15,23,32,0.88)] hover:bg-[rgba(28,42,58,0.95)] text-slate-200 border border-[rgba(255,255,255,0.1)] rounded-xl transition shadow-lg"
          >
            {state.soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* 2. Flora Inspector Card (Shows on clicking 3D plants) */}
      {selectedFlora && (
        <aside
          aria-label="Botanical Specimen Details"
          className="absolute top-20 right-4 w-80 bg-[rgba(16,24,34,0.92)] border border-[rgba(74,222,128,0.25)] rounded-2xl p-4 text-slate-200 shadow-2xl z-30 pointer-events-auto animate-in fade-in slide-in-from-right duration-200"
        >
          <div className="flex items-start justify-between pb-2 border-b border-slate-700/60">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                Botanical Specimen
              </span>
              <h2 className="text-base font-semibold text-white">
                {selectedFlora.species.name}
              </h2>
              <p className="text-xs italic text-slate-400">
                {selectedFlora.species.scientificName}
              </p>
            </div>
            <button
              onClick={onCloseFloraCard}
              aria-label="Close specimen inspector"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-3 leading-relaxed">
            {selectedFlora.species.description}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Light Need</span>
              <span className="font-medium text-amber-200">
                {selectedFlora.species.lightPreference}
              </span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Humidity</span>
              <span className="font-medium text-cyan-200">
                {selectedFlora.species.humidityNeed}
              </span>
            </div>
          </div>

          <button
            onClick={() => onCameraChange('macro')}
            className="w-full mt-3 py-1.5 px-3 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Focus Macro View
          </button>
        </aside>
      )}

      {/* 3. Sleek Collapsible Bottom Control Dock */}
      <nav
        aria-label="Terrarium Controls Dock"
        style={{
          bottom: isCollapsed ? '-260px' : '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 'min(940px, 95vw)',
        }}
        className="fixed transition-all duration-300 ease-out z-20 w-full flex flex-col items-center pointer-events-auto"
      >
        {/* Collapse / Expand Tab Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Show terrarium controls' : 'Hide terrarium controls (Zen View)'}
          className="mb-1 px-4 py-1.5 bg-[rgba(15,23,32,0.92)] hover:bg-[rgba(24,35,48,0.95)] text-slate-300 hover:text-white border border-[rgba(255,255,255,0.12)] border-b-0 rounded-t-xl text-xs font-medium flex items-center gap-2 shadow-md transition"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zen View (Hide HUD)</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        <div className="w-full bg-[rgba(15,23,32,0.92)] border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-2xl p-4 text-slate-200">
          {/* Navigation Tabs Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setActiveTab('time')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition ${
                  activeTab === 'time'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Time & Sunlight</span>
                <span className="sm:hidden">Time</span>
              </button>
              <button
                onClick={() => setActiveTab('weather')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition ${
                  activeTab === 'weather'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Weather & Climate</span>
                <span className="sm:hidden">Weather</span>
              </button>
              <button
                onClick={() => setActiveTab('biome')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition ${
                  activeTab === 'biome'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Flower2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flora & Vessel</span>
                <span className="sm:hidden">Flora</span>
              </button>
              <button
                onClick={() => setActiveTab('sound')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition ${
                  activeTab === 'sound'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sound & Camera</span>
                <span className="sm:hidden">Sound</span>
              </button>
            </div>

            {/* Quick Camera Presets Pill */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 text-[11px]">
              <span className="text-slate-500 px-1.5 text-[10px]">View:</span>
              <button
                onClick={() => onCameraChange('orbit')}
                className={`px-2 py-0.5 rounded-lg ${state.cameraPreset === 'orbit' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
              >
                Orbit
              </button>
              <button
                onClick={() => onCameraChange('macro')}
                className={`px-2 py-0.5 rounded-lg ${state.cameraPreset === 'macro' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
              >
                Macro
              </button>
              <button
                onClick={() => onCameraChange('zenith')}
                className={`px-2 py-0.5 rounded-lg ${state.cameraPreset === 'zenith' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
              >
                Zenith
              </button>
            </div>
          </div>

          {/* TAB 1: TIME & LIGHTING */}
          {activeTab === 'time' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Current Time:</span>
                  <span className="text-sm font-semibold font-mono text-emerald-300">
                    {formatTimeOfDay(state.timeOfDay)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setPresetTime(6)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-700 transition"
                  >
                    🌅 Dawn
                  </button>
                  <button
                    onClick={() => setPresetTime(12)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
                  >
                    ☀️ Noon
                  </button>
                  <button
                    onClick={() => setPresetTime(18.5)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 transition"
                  >
                    🌇 Sunset
                  </button>
                  <button
                    onClick={() => setPresetTime(0)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-slate-700 transition"
                  >
                    🌙 Midnight
                  </button>
                </div>
              </div>

              {/* 24-Hour Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.05"
                  value={state.timeOfDay}
                  aria-label="Time of day"
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    onChange(prev => ({
                      ...prev,
                      timeOfDay: val,
                      autoCycle: false,
                    }));
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>12 AM</span>
                </div>
              </div>

              {/* Auto Cycle Controls */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => onChange(prev => ({ ...prev, autoCycle: !prev.autoCycle }))}
                  className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                    state.autoCycle
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {state.autoCycle ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {state.autoCycle ? 'Auto Day/Night Active' : 'Start Day/Night Cycle'}
                </button>

                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span>Cycle Speed:</span>
                  {[1, 2, 5].map(spd => (
                    <button
                      key={spd}
                      onClick={() => onChange(prev => ({ ...prev, cycleSpeed: spd }))}
                      className={`px-2 py-0.5 rounded text-xs ${
                        state.cycleSpeed === spd
                          ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEATHER & CLIMATE */}
          {activeTab === 'weather' && (
            <div className="space-y-3">
              {/* Weather Preset Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'clear', label: 'Clear Sun', icon: Sun },
                  { id: 'mist', label: 'Dew Mist', icon: CloudFog },
                  { id: 'rain', label: 'Micro-Rain', icon: CloudRain },
                  { id: 'fireflies', label: 'Fireflies', icon: Sparkles },
                  { id: 'sunbeams', label: 'Sunbeams', icon: Sun },
                ].map(item => {
                  const Icon = item.icon;
                  const active = state.weather === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setWeather(item.id as WeatherType)}
                      className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 border transition ${
                        active
                          ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-md'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-700/50 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Climate Fine Tuning Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-400" />
                      Glass Condensation
                    </span>
                    <span className="text-slate-300 font-mono">
                      {Math.round(state.condensation * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.condensation}
                    aria-label="Condensation on glass"
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      onChange(prev => ({ ...prev, condensation: val }));
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <CloudFog className="w-3 h-3 text-slate-300" />
                      Atmospheric Mist
                    </span>
                    <span className="text-slate-300 font-mono">
                      {Math.round(state.mistDensity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.mistDensity}
                    aria-label="Atmospheric mist density"
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      onChange(prev => ({ ...prev, mistDensity: val }));
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-slate-300"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Wind className="w-3 h-3 text-emerald-400" />
                      Flora Breeze
                    </span>
                    <span className="text-slate-300 font-mono">
                      {Math.round(state.windSpeed * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.windSpeed}
                    aria-label="Flora breeze wind speed"
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      onChange(prev => ({ ...prev, windSpeed: val }));
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BIOME & VESSEL */}
          {activeTab === 'biome' && (
            <div className="space-y-3">
              {/* Biome Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'rainforest', name: 'Rainforest', desc: 'Ferns & Bonsai' },
                  { id: 'succulent', name: 'Desert Oasis', desc: 'Opaline Echeveria' },
                  { id: 'zen', name: 'Zen Garden', desc: 'Moss & Miniature Pine' },
                  { id: 'twilight', name: 'Mystic Spores', desc: 'Glowing Mushrooms' },
                ].map(b => (
                  <button
                    key={b.id}
                    onClick={() => onChange(prev => ({ ...prev, biome: b.id as TerrariumBiome }))}
                    className={`p-2.5 rounded-xl text-left border transition ${
                      state.biome === b.id
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="text-xs font-semibold">{b.name}</div>
                    <div className="text-[10px] text-slate-400">{b.desc}</div>
                  </button>
                ))}
              </div>

              {/* Vessel Features & Reseed */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onReseed}
                    className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regrow New Garden
                  </button>

                  <button
                    onClick={() => onChange(prev => ({ ...prev, lidOpen: !prev.lidOpen }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      state.lidOpen
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {state.lidOpen ? 'Close Glass Lid' : 'Lift Glass Lid'}
                  </button>
                </div>

                {/* Glass Transparency */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Glass Opacity:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={state.glassOpacity}
                    aria-label="Glass vessel opacity"
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      onChange(prev => ({ ...prev, glassOpacity: val }));
                    }}
                    className="w-24 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
                  />
                  <span className="text-slate-400 font-mono text-[11px]">
                    {Math.round(state.glassOpacity * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOUNDSCAPE & CAMERA */}
          {activeTab === 'sound' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Audio Controls */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Synthesized Audio Soundscape</span>
                    <button
                      onClick={playChime}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] hover:bg-amber-500/30 flex items-center gap-1"
                    >
                      <Bell className="w-3 h-3" />
                      Singing Bowl Chime (528Hz)
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleMute}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
                        state.soundMuted
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {state.soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      {state.soundMuted ? 'Muted' : 'Audio On'}
                    </button>

                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Master Volume</span>
                        <span>{Math.round(state.soundVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={state.soundMuted ? 0 : state.soundVolume}
                        aria-label="Soundscape master volume"
                        onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Ambient layers adapt in real-time to your chosen weather and time of day.
                  </p>
                </div>

                {/* Camera View Angles */}
                <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-4">
                  <div className="text-xs font-semibold text-slate-300">
                    Camera Viewing Angles
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => onCameraChange('orbit')}
                      className={`p-2 rounded-xl border text-left ${state.cameraPreset === 'orbit' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                    >
                      <div className="font-medium">Showcase Orbit</div>
                      <div className="text-[10px] text-slate-400">3/4 Dynamic Angle</div>
                    </button>
                    <button
                      onClick={() => onCameraChange('macro')}
                      className={`p-2 rounded-xl border text-left ${state.cameraPreset === 'macro' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                    >
                      <div className="font-medium">Macro Close-up</div>
                      <div className="text-[10px] text-slate-400">Flora details</div>
                    </button>
                    <button
                      onClick={() => onCameraChange('zenith')}
                      className={`p-2 rounded-xl border text-left ${state.cameraPreset === 'zenith' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                    >
                      <div className="font-medium">Zenith Top-down</div>
                      <div className="text-[10px] text-slate-400">Bird's-eye view</div>
                    </button>
                    <button
                      onClick={() => onCameraChange('front')}
                      className={`p-2 rounded-xl border text-left ${state.cameraPreset === 'front' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                    >
                      <div className="font-medium">Front Horizon</div>
                      <div className="text-[10px] text-slate-400">Eye-level silhouette</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};
