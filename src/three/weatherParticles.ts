import * as THREE from 'three';
import { WeatherType } from '../types/terrarium';

export interface WeatherRig {
  group: THREE.Group;
  update: (delta: number, time: number, weather: WeatherType, rainIntensity: number, mistDensity: number, starsOpacity: number, sunPos: THREE.Vector3) => void;
  dispose: () => void;
}

export function createWeatherParticles(isSoftwareGl: boolean): WeatherRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'WeatherAtmosphere';

  // 1. Rain Streaks (LineSegments)
  const rainCount = isSoftwareGl ? 120 : 280;
  const rainGeo = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 2 * 3);
  const rainVelocities: number[] = [];

  for (let i = 0; i < rainCount; i++) {
    // Generate inside terrarium radius (~1.8) and height (0.8 to 4.2)
    const angle = Math.random() * Math.PI * 2;
    const rad = Math.random() * 1.8;
    const x = Math.cos(angle) * rad;
    const z = Math.sin(angle) * rad;
    const y = 0.8 + Math.random() * 3.4;

    const streakLen = 0.12 + Math.random() * 0.08;

    // Line start
    rainPositions[i * 6 + 0] = x;
    rainPositions[i * 6 + 1] = y;
    rainPositions[i * 6 + 2] = z;

    // Line end
    rainPositions[i * 6 + 3] = x;
    rainPositions[i * 6 + 4] = y - streakLen;
    rainPositions[i * 6 + 5] = z;

    rainVelocities.push(4.5 + Math.random() * 3.5);
  }

  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0xa4c7e8,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.visible = false;
  rootGroup.add(rainLines);

  // 2. Mist / Vapor Particles (Soft billowy discs)
  const mistCount = isSoftwareGl ? 20 : 45;
  const mistGeo = new THREE.BufferGeometry();
  const mistPositions = new Float32Array(mistCount * 3);
  const mistData: Array<{ x: number; y: number; z: number; speed: number; angle: number; radius: number }> = [];

  for (let i = 0; i < mistCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.3 + Math.random() * 1.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.8 + Math.random() * 1.6;

    mistPositions[i * 3 + 0] = x;
    mistPositions[i * 3 + 1] = y;
    mistPositions[i * 3 + 2] = z;

    mistData.push({
      x,
      y,
      z,
      speed: 0.2 + Math.random() * 0.3,
      angle,
      radius,
    });
  }

  // Procedural soft circle sprite for mist
  const mistCanvas = document.createElement('canvas');
  mistCanvas.width = 64;
  mistCanvas.height = 64;
  const mCtx = mistCanvas.getContext('2d')!;
  const mGrad = mCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  mGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  mGrad.addColorStop(0.5, 'rgba(235, 245, 255, 0.15)');
  mGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  mCtx.fillStyle = mGrad;
  mCtx.fillRect(0, 0, 64, 64);
  const mistTexture = new THREE.CanvasTexture(mistCanvas);

  mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
  const mistMat = new THREE.PointsMaterial({
    map: mistTexture,
    size: 1.2,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mistPoints = new THREE.Points(mistGeo, mistMat);
  mistPoints.visible = false;
  rootGroup.add(mistPoints);

  // 3. Fireflies / Luminous Spores
  const fireflyCount = isSoftwareGl ? 25 : 55;
  const fireflyGeo = new THREE.BufferGeometry();
  const fireflyPositions = new Float32Array(fireflyCount * 3);
  const fireflySeeds: Array<{ basePos: THREE.Vector3; speed: number; phase: number; radius: number }> = [];

  for (let i = 0; i < fireflyCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.2 + Math.random() * 1.6;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.9 + Math.random() * 2.8;

    fireflyPositions[i * 3 + 0] = x;
    fireflyPositions[i * 3 + 1] = y;
    fireflyPositions[i * 3 + 2] = z;

    fireflySeeds.push({
      basePos: new THREE.Vector3(x, y, z),
      speed: 0.8 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      radius: 0.15 + Math.random() * 0.25,
    });
  }

  // Glowing point sprite for fireflies
  const flyCanvas = document.createElement('canvas');
  flyCanvas.width = 64;
  flyCanvas.height = 64;
  const fCtx = flyCanvas.getContext('2d')!;
  const fGrad = fCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  fGrad.addColorStop(0, 'rgba(255, 255, 220, 1.0)');
  fGrad.addColorStop(0.3, 'rgba(150, 255, 170, 0.75)');
  fGrad.addColorStop(0.7, 'rgba(80, 240, 190, 0.25)');
  fGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  fCtx.fillStyle = fGrad;
  fCtx.fillRect(0, 0, 64, 64);
  const fireflyTexture = new THREE.CanvasTexture(flyCanvas);

  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
  const fireflyMat = new THREE.PointsMaterial({
    map: fireflyTexture,
    size: 0.22,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const fireflyPoints = new THREE.Points(fireflyGeo, fireflyMat);
  rootGroup.add(fireflyPoints);

  // 4. Sunbeams / Volumetric Light Shafts
  const shaftGeo = new THREE.CylinderGeometry(0.35, 1.4, 4.2, 16, 1, true);
  const shaftMat = new THREE.MeshBasicMaterial({
    color: 0xfff0b8,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
  shaftMesh.position.set(0.2, 2.5, 0.2);
  shaftMesh.rotation.z = 0.25;
  shaftMesh.rotation.x = -0.15;
  shaftMesh.visible = false;
  rootGroup.add(shaftMesh);

  // 5. Starfield Dome (Background Celestial Stars)
  const starCount = 350;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    // Distant sphere radius 35
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 35;
    const sinPhi = Math.sin(phi);

    starPositions[i * 3 + 0] = r * sinPhi * Math.cos(theta);
    starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 2; // Upper hemisphere
    starPositions[i * 3 + 2] = r * sinPhi * Math.sin(theta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.35,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const starPoints = new THREE.Points(starGeo, starMat);
  rootGroup.add(starPoints);

  const update = (
    delta: number,
    time: number,
    weather: WeatherType,
    rainIntensity: number,
    mistDensity: number,
    starsOpacity: number,
    sunPos: THREE.Vector3
  ) => {
    // 1. Update Rain
    const showRain = rainIntensity > 0.02 || weather === 'rain';
    rainLines.visible = showRain;
    if (showRain) {
      rainMat.opacity = Math.min(0.8, rainIntensity * 0.9);
      const pos = rainGeo.attributes.position;
      for (let i = 0; i < rainCount; i++) {
        const vel = rainVelocities[i] * delta * (0.8 + rainIntensity * 0.5);
        let yTop = pos.getY(i * 2);
        let yBot = pos.getY(i * 2 + 1);

        yTop -= vel;
        yBot -= vel;

        // Reset when hitting bottom soil layer (~0.75)
        if (yBot < 0.72) {
          yTop = 4.0 + Math.random() * 0.3;
          yBot = yTop - (0.12 + Math.random() * 0.08);
        }

        pos.setY(i * 2, yTop);
        pos.setY(i * 2 + 1, yBot);
      }
      pos.needsUpdate = true;
    }

    // 2. Update Mist
    const showMist = mistDensity > 0.05 || weather === 'mist';
    mistPoints.visible = showMist;
    if (showMist) {
      mistMat.opacity = mistDensity * 0.35;
      const pos = mistGeo.attributes.position;
      for (let i = 0; i < mistCount; i++) {
        const data = mistData[i];
        data.angle += delta * data.speed * 0.2;
        const x = Math.cos(data.angle) * data.radius;
        const z = Math.sin(data.angle) * data.radius;
        const y = data.y + Math.sin(time * 0.8 + i) * 0.08;

        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // 3. Update Fireflies / Spores
    const showFly = weather === 'fireflies' || starsOpacity > 0.3;
    fireflyPoints.visible = showFly;
    if (showFly) {
      fireflyMat.opacity = Math.max(0.2, (weather === 'fireflies' ? 0.9 : starsOpacity * 0.75));
      const pos = fireflyGeo.attributes.position;
      for (let i = 0; i < fireflyCount; i++) {
        const seed = fireflySeeds[i];
        const t = time * seed.speed + seed.phase;
        // 3D Lissajous orbit
        const x = seed.basePos.x + Math.sin(t) * seed.radius;
        const y = seed.basePos.y + Math.sin(t * 1.3) * (seed.radius * 0.7);
        const z = seed.basePos.z + Math.cos(t * 0.8) * seed.radius;

        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // 4. Update Sunbeams
    const showBeams = weather === 'sunbeams';
    shaftMesh.visible = showBeams;
    if (showBeams) {
      shaftMesh.lookAt(sunPos);
      shaftMat.opacity = 0.09 + Math.sin(time * 1.5) * 0.02;
    }

    // 5. Update Stars
    starMat.opacity = starsOpacity;
    if (starsOpacity > 0.05) {
      // Subtle twinkle
      starMat.size = 0.3 + Math.sin(time * 2.0) * 0.05;
    }
  };

  const dispose = () => {
    rainGeo.dispose();
    rainMat.dispose();
    mistGeo.dispose();
    mistMat.dispose();
    mistTexture.dispose();
    fireflyGeo.dispose();
    fireflyMat.dispose();
    fireflyTexture.dispose();
    shaftGeo.dispose();
    shaftMat.dispose();
    starGeo.dispose();
    starMat.dispose();
  };

  return {
    group: rootGroup,
    update,
    dispose,
  };
}
