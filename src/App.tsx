import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TerrariumState, CameraPreset, PlacedFlora } from './types/terrarium';
import { initTerrariumScene, SceneController } from './three/terrariumScene';
import { ControlOverlay } from './components/ControlOverlay';
import { soundscape } from './audio/soundscape';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneControllerRef = useRef<SceneController | null>(null);

  // Core Application State
  const [terrariumState, setTerrariumState] = useState<TerrariumState>({
    timeOfDay: 14.0, // 2:00 PM sunny afternoon default
    autoCycle: false,
    cycleSpeed: 1,

    weather: 'clear',
    rainIntensity: 0.0,
    mistDensity: 0.05,
    condensation: 0.2,
    windSpeed: 0.25,

    biome: 'rainforest',
    floraDensity: 1.0,
    biomeSeed: 1337,
    lidOpen: false,
    glassOpacity: 0.95,
    showSoilLayers: true,

    soundMuted: true,
    soundVolume: 0.5,
    chimeActive: false,

    cameraPreset: 'orbit',
    selectedFlora: null,
    zenMode: false,
  });

  const [selectedFlora, setSelectedFlora] = useState<PlacedFlora | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!containerRef.current) return;

    const controller = initTerrariumScene(
      containerRef.current,
      terrariumState,
      (flora: PlacedFlora | null) => {
        setSelectedFlora(flora);
      }
    );

    sceneControllerRef.current = controller;

    return () => {
      controller.dispose();
      sceneControllerRef.current = null;
      soundscape.dispose();
    };
  }, []); // Run only once on mount

  // Sync state changes with 3D scene & soundscape
  useEffect(() => {
    if (sceneControllerRef.current) {
      sceneControllerRef.current.updateState(terrariumState);
    }
    soundscape.updateEnvironment(
      terrariumState.rainIntensity,
      terrariumState.windSpeed,
      terrariumState.timeOfDay
    );
  }, [terrariumState]);

  // Handle camera preset changes
  const handleCameraChange = useCallback((preset: CameraPreset) => {
    setTerrariumState(prev => ({ ...prev, cameraPreset: preset }));
    if (sceneControllerRef.current) {
      sceneControllerRef.current.setCameraPreset(preset);
    }
  }, []);

  // Handle re-seeding the flora layout
  const handleReseed = useCallback(() => {
    const nextSeed = Math.floor(Math.random() * 100000);
    setTerrariumState(prev => ({ ...prev, biomeSeed: nextSeed }));
  }, []);

  // Handle screenshot download
  const handleCaptureScreenshot = useCallback(() => {
    if (!sceneControllerRef.current) return;
    const dataUrl = sceneControllerRef.current.captureScreenshot();
    const link = document.createElement('a');
    link.download = `terrarium-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  // Keyboard shortcut 'H' for zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setTerrariumState(prev => ({ ...prev, zenMode: !prev.zenMode }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        data-testid="terrarium-canvas-container"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating HUD / Bottom Control Dock */}
      <ControlOverlay
        state={terrariumState}
        onChange={setTerrariumState}
        onCameraChange={handleCameraChange}
        onReseed={handleReseed}
        onCaptureScreenshot={handleCaptureScreenshot}
        selectedFlora={selectedFlora}
        onCloseFloraCard={() => setSelectedFlora(null)}
      />
    </main>
  );
}
