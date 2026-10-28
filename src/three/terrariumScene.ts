import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  TerrariumState,
  PlacedFlora,
} from '../types/terrarium';
import { calculateLighting, generateFloraLayout } from '../utils/terrarium-logic';
import { createTerrariumVessel, GlassDomeRig } from './glassDome';
import { buildProceduralFlora, FloraRig } from './proceduralFlora';
import { createWeatherParticles, WeatherRig } from './weatherParticles';

export interface SceneController {
  updateState: (state: TerrariumState) => void;
  reseedFlora: (biome: TerrariumState['biome'], seed: number, density: number) => void;
  setCameraPreset: (preset: 'orbit' | 'macro' | 'zenith' | 'front') => void;
  captureScreenshot: () => string;
  onFloraSelect: (flora: PlacedFlora | null) => void;
  dispose: () => void;
}

export function initTerrariumScene(
  container: HTMLDivElement,
  initialState: TerrariumState,
  onFloraClick: (flora: PlacedFlora | null) => void
): SceneController {
  // 1. Detect Software-WebGL Guard
  const isSoftwareGl = (() => {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  })();

  // 2. Setup Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1017);

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
  camera.position.set(0, 3.2, 7.2);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);

  // 3. Procedural Studio Reflection Environment
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  // 4. Fog
  scene.fog = new THREE.FogExp2(0x0a1017, 0.018);

  // 5. Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 1.8, 0);
  controls.minDistance = 2.5;
  controls.maxDistance = 14.0;
  controls.maxPolarAngle = Math.PI * 0.52; // Prevent going beneath wooden base

  // 6. Lighting Rig
  // Key Sun Light (Directional with tight shadow bounds)
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
  sunLight.position.set(10, 14, 8);
  sunLight.castShadow = !isSoftwareGl;
  if (!isSoftwareGl) {
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1.0;
    sunLight.shadow.camera.far = 30;
    const d = 3.5;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
  }
  scene.add(sunLight);

  // Cool Sky/Ground Fill (HemisphereLight)
  const hemiLight = new THREE.HemisphereLight(0xb3d8fd, 0x3f4f3c, 0.7);
  scene.add(hemiLight);

  // Soft Moon Light
  const moonLight = new THREE.DirectionalLight(0x5588cc, 0.2);
  moonLight.position.set(-8, 12, -6);
  scene.add(moonLight);

  // Sun Orb Visual Mesh
  const sunOrbGeo = new THREE.SphereGeometry(0.8, 16, 16);
  const sunOrbMat = new THREE.MeshBasicMaterial({ color: 0xffeedd });
  const sunOrb = new THREE.Mesh(sunOrbGeo, sunOrbMat);
  scene.add(sunOrb);

  // Moon Orb Visual Mesh
  const moonOrbGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const moonOrbMat = new THREE.MeshBasicMaterial({ color: 0xd8e6f3 });
  const moonOrb = new THREE.Mesh(moonOrbGeo, moonOrbMat);
  scene.add(moonOrb);

  // 7. Terrarium Components
  const vesselRig: GlassDomeRig = createTerrariumVessel(isSoftwareGl);
  scene.add(vesselRig.group);

  let floraList = generateFloraLayout(initialState.biome, initialState.biomeSeed, initialState.floraDensity);
  let floraRig: FloraRig = buildProceduralFlora(floraList, isSoftwareGl);
  scene.add(floraRig.group);

  const weatherRig: WeatherRig = createWeatherParticles(isSoftwareGl);
  scene.add(weatherRig.group);

  // 8. State management
  let currentState: TerrariumState = { ...initialState };
  let currentBiolum = 0;

  // Camera animation interpolation
  let targetCamPos: THREE.Vector3 | null = null;
  let targetCamTarget: THREE.Vector3 | null = null;

  const setCameraPreset = (preset: 'orbit' | 'macro' | 'zenith' | 'front') => {
    switch (preset) {
      case 'macro':
        targetCamPos = new THREE.Vector3(0.8, 1.4, 2.4);
        targetCamTarget = new THREE.Vector3(0.1, 1.1, 0.1);
        break;
      case 'zenith':
        targetCamPos = new THREE.Vector3(0, 7.8, 0.2);
        targetCamTarget = new THREE.Vector3(0, 1.5, 0);
        break;
      case 'front':
        targetCamPos = new THREE.Vector3(0, 2.2, 5.8);
        targetCamTarget = new THREE.Vector3(0, 1.8, 0);
        break;
      case 'orbit':
      default:
        targetCamPos = new THREE.Vector3(0, 3.2, 7.2);
        targetCamTarget = new THREE.Vector3(0, 1.8, 0);
        break;
    }
  };

  const reseedFlora = (biome: TerrariumState['biome'], seed: number, density: number) => {
    scene.remove(floraRig.group);
    floraRig.dispose();

    floraList = generateFloraLayout(biome, seed, density);
    floraRig = buildProceduralFlora(floraList, isSoftwareGl);
    scene.add(floraRig.group);
  };

  const updateState = (newState: TerrariumState) => {
    const prevLid = currentState.lidOpen;
    const prevBiome = currentState.biome;
    const prevSeed = currentState.biomeSeed;
    const prevDensity = currentState.floraDensity;
    const prevCond = currentState.condensation;

    currentState = { ...newState };

    if (prevLid !== currentState.lidOpen) {
      vesselRig.setLidOpen(currentState.lidOpen);
    }

    if (Math.abs(prevCond - currentState.condensation) > 0.05) {
      vesselRig.updateCondensation(currentState.condensation);
    }

    if (
      prevBiome !== currentState.biome ||
      prevSeed !== currentState.biomeSeed ||
      prevDensity !== currentState.floraDensity
    ) {
      reseedFlora(currentState.biome, currentState.biomeSeed, currentState.floraDensity);
    }

    // Glass visibility & lid
    vesselRig.glassMaterial.visible = currentState.glassOpacity > 0.05;
    vesselRig.glassMaterial.opacity = isSoftwareGl ? currentState.glassOpacity * 0.35 : currentState.glassOpacity;
  };

  // Initial setup call
  vesselRig.updateCondensation(initialState.condensation);
  vesselRig.setLidOpen(initialState.lidOpen);

  // 9. Raycasting for Plant Inspection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const handlePointerDown = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(floraRig.interactiveMeshes, true);

    if (intersects.length > 0) {
      // Find root object in interactiveMeshes
      let curr: THREE.Object3D | null = intersects[0].object;
      while (curr && curr.parent && curr.parent !== floraRig.group) {
        curr = curr.parent;
      }
      if (curr && curr.userData && curr.userData.floraItem) {
        onFloraClick(curr.userData.floraItem as PlacedFlora);
        return;
      }
    }
  };

  renderer.domElement.addEventListener('pointerdown', handlePointerDown);

  // 10. Resize handler
  const handleResize = () => {
    if (!container) return;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };

  window.addEventListener('resize', handleResize);

  // 11. Render Loop with Delta Time and Software WebGL Safeguard
  let frameId = 0;
  let lastTime = performance.now();
  let elapsedTime = 0;

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function tick() {
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    elapsedTime += delta;

    // Advance time if auto-cycle is enabled
    if (currentState.autoCycle) {
      currentState.timeOfDay = (currentState.timeOfDay + delta * currentState.cycleSpeed * 0.1) % 24;
    }

    // Calculate dynamic lighting from time of day & weather
    const lighting = calculateLighting(currentState.timeOfDay, currentState.weather);
    currentBiolum = lighting.biolumIntensity;

    // Apply lighting
    sunLight.color.set(lighting.sunColor);
    sunLight.intensity = lighting.sunIntensity;
    sunLight.position.set(...lighting.sunPosition);

    hemiLight.color.set(lighting.hemiSkyColor);
    hemiLight.groundColor.set(lighting.hemiGroundColor);
    hemiLight.intensity = lighting.hemiIntensity;

    moonLight.intensity = lighting.moonIntensity;

    // Position celestial orbs
    sunOrb.position.set(...lighting.sunPosition);
    sunOrb.visible = lighting.sunPosition[1] > -1;

    moonOrb.position.set(-lighting.sunPosition[0], -lighting.sunPosition[1], -lighting.sunPosition[2]);
    moonOrb.visible = moonOrb.position.y > -1;

    // Atmospheric fog & background sky
    if (scene.fog) {
      (scene.fog as THREE.FogExp2).color.set(lighting.fogColor);
      (scene.fog as THREE.FogExp2).density = lighting.fogDensity;
    }
    (scene.background as THREE.Color).set(lighting.fogColor);

    // Camera preset transition damping
    if (targetCamPos && targetCamTarget) {
      const camDamp = 1 - Math.exp(-3.5 * delta);
      camera.position.lerp(targetCamPos, camDamp);
      controls.target.lerp(targetCamTarget, camDamp);

      if (camera.position.distanceTo(targetCamPos) < 0.05) {
        targetCamPos = null;
        targetCamTarget = null;
      }
    }

    controls.update();

    // Update rigs
    vesselRig.update(delta);
    floraRig.update(elapsedTime, currentState.windSpeed, currentBiolum);
    weatherRig.update(
      delta,
      elapsedTime,
      currentState.weather,
      currentState.rainIntensity,
      currentState.mistDensity,
      lighting.starsOpacity,
      sunLight.position
    );

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  // Start tick loop
  tick();

  const captureScreenshot = (): string => {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  };

  const dispose = () => {
    if (isSoftwareGl) {
      clearTimeout(frameId);
    } else {
      cancelAnimationFrame(frameId);
    }

    renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
    window.removeEventListener('resize', handleResize);

    vesselRig.dispose();
    floraRig.dispose();
    weatherRig.dispose();

    sunOrbGeo.dispose();
    sunOrbMat.dispose();
    moonOrbGeo.dispose();
    moonOrbMat.dispose();

    controls.dispose();
    renderer.dispose();

    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  };

  return {
    updateState,
    reseedFlora,
    setCameraPreset,
    captureScreenshot,
    onFloraSelect: onFloraClick,
    dispose,
  };
}
