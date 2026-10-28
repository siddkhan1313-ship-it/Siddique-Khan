import * as THREE from 'three';
import { PlacedFlora } from '../types/terrarium';
import { createLeafTexture, createWoodBarkTexture } from './proceduralTextures';

export interface FloraRig {
  group: THREE.Group;
  interactiveMeshes: THREE.Object3D[];
  update: (time: number, windSpeed: number, biolumIntensity: number) => void;
  dispose: () => void;
}

export function buildProceduralFlora(
  floraList: PlacedFlora[],
  isSoftwareGl: boolean
): FloraRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'FloraForest';

  const interactiveMeshes: THREE.Object3D[] = [];
  const animatedFlora: Array<{
    mesh: THREE.Group;
    baseRotZ: number;
    baseRotX: number;
    phase: number;
    freq: number;
    updateBiolum?: (intensity: number) => void;
  }> = [];

  // Shared textures & materials
  const leafTexture = createLeafTexture();
  const barkTexture = createWoodBarkTexture();

  const fernMat = new THREE.MeshStandardMaterial({
    map: leafTexture,
    color: 0x4aa336,
    roughness: 0.55,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x24180d, // Dark ebony wiry fern stipe
    roughness: 0.7,
    metalness: 0.1,
  });

  const succulentMat = new THREE.MeshStandardMaterial({
    color: 0x76bfa8,
    roughness: 0.35,
    metalness: 0.05,
  });

  const succulentTipMat = new THREE.MeshStandardMaterial({
    color: 0xda829c, // Soft coral-pink blushed tips
    roughness: 0.3,
    metalness: 0.05,
  });

  const bonsaiBarkMat = new THREE.MeshStandardMaterial({
    map: barkTexture,
    color: 0x5a3e2a,
    roughness: 0.8,
    metalness: 0.05,
  });

  const foliageMat1 = new THREE.MeshStandardMaterial({
    color: 0x2e6629,
    roughness: 0.75,
    metalness: 0.05,
  });

  const foliageMat2 = new THREE.MeshStandardMaterial({
    color: 0x448a39,
    roughness: 0.7,
    metalness: 0.05,
  });

  const flowerStemMat = new THREE.MeshStandardMaterial({
    color: 0x3d702d,
    roughness: 0.6,
  });

  const flowerPetalMat = new THREE.MeshStandardMaterial({
    color: 0x8a9bf5, // Alpine azure-lavender
    roughness: 0.4,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x7a7d80,
    roughness: 0.85,
    metalness: 0.15,
  });

  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x5b9432,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Track geometries and materials for disposal
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [
    fernMat,
    stemMat,
    succulentMat,
    succulentTipMat,
    bonsaiBarkMat,
    foliageMat1,
    foliageMat2,
    flowerStemMat,
    flowerPetalMat,
    stoneMat,
    mossMat,
  ];

  // Helper builder: Maidenhair Fern (Composite 7-12 parts)
  function createFern(): THREE.Group {
    const fernGroup = new THREE.Group();
    // Central rhizome crown
    const crownGeo = new THREE.SphereGeometry(0.08, 8, 8);
    geometriesToDispose.push(crownGeo);
    const crown = new THREE.Mesh(crownGeo, stemMat);
    crown.position.y = 0.04;
    fernGroup.add(crown);

    // Arching fronds
    const frondCount = 7;
    for (let f = 0; f < frondCount; f++) {
      const frondAngle = (f / frondCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const frondLength = 0.65 + Math.random() * 0.35;
      const frondArch = 0.35 + Math.random() * 0.2;

      // Stem spline
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0.04, 0),
        new THREE.Vector3(Math.cos(frondAngle) * 0.15, 0.25, Math.sin(frondAngle) * 0.15),
        new THREE.Vector3(Math.cos(frondAngle) * (frondLength * 0.7), frondArch * 1.2, Math.sin(frondAngle) * (frondLength * 0.7)),
        new THREE.Vector3(Math.cos(frondAngle) * frondLength, frondArch * 0.6, Math.sin(frondAngle) * frondLength)
      );

      const stemGeo = new THREE.TubeGeometry(curve, 16, 0.012, 6, false);
      geometriesToDispose.push(stemGeo);
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      fernGroup.add(stemMesh);

      // Delicate leaflets along the stem
      const leafletCount = 6;
      for (let l = 1; l <= leafletCount; l++) {
        const t = l / (leafletCount + 1);
        const pt = curve.getPoint(t);
        const leafGeo = new THREE.PlaneGeometry(0.09 * (1.1 - t * 0.4), 0.07 * (1.1 - t * 0.4));
        geometriesToDispose.push(leafGeo);
        
        // Left leaflet
        const leafL = new THREE.Mesh(leafGeo, fernMat);
        leafL.position.copy(pt);
        leafL.rotation.y = frondAngle + Math.PI / 4;
        leafL.rotation.z = 0.3;
        fernGroup.add(leafL);

        // Right leaflet
        const leafR = new THREE.Mesh(leafGeo, fernMat);
        leafR.position.copy(pt);
        leafR.rotation.y = frondAngle - Math.PI / 4;
        leafR.rotation.z = -0.3;
        fernGroup.add(leafR);
      }
    }

    // Emerging center spiral fiddlehead
    const fiddleCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3(0.02, 0.2, 0.02),
      new THREE.Vector3(0.05, 0.24, 0.0)
    );
    const fiddleGeo = new THREE.TubeGeometry(fiddleCurve, 12, 0.015, 6, false);
    geometriesToDispose.push(fiddleGeo);
    const fiddleMesh = new THREE.Mesh(fiddleGeo, stemMat);
    fernGroup.add(fiddleMesh);

    return fernGroup;
  }

  // Helper builder: Opaline Echeveria Succulent (Composite 16-24 parts)
  function createSucculent(): THREE.Group {
    const succGroup = new THREE.Group();

    // Central core stem
    const coreGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.1, 10);
    geometriesToDispose.push(coreGeo);
    const core = new THREE.Mesh(coreGeo, succulentMat);
    core.position.y = 0.05;
    succGroup.add(core);

    // Fleshy spoon-shaped petal geometry (flattened tapered ellipsoid)
    const petalGeo = new THREE.SphereGeometry(1, 12, 8);
    petalGeo.scale(0.18, 0.06, 0.32);
    geometriesToDispose.push(petalGeo);

    // Spiraling concentric rings of fleshy leaves
    const rings = [
      { count: 4, radius: 0.08, y: 0.18, scale: 0.7, tiltX: 0.35 },
      { count: 6, radius: 0.16, y: 0.14, scale: 0.9, tiltX: 0.55 },
      { count: 8, radius: 0.28, y: 0.10, scale: 1.15, tiltX: 0.75 },
      { count: 10, radius: 0.42, y: 0.06, scale: 1.35, tiltX: 0.95 },
    ];

    rings.forEach((ring, rIdx) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2 + (rIdx * 0.45);
        const leaf = new THREE.Mesh(petalGeo, rIdx === 0 ? succulentTipMat : succulentMat);
        
        leaf.position.x = Math.cos(angle) * ring.radius;
        leaf.position.z = Math.sin(angle) * ring.radius;
        leaf.position.y = ring.y;

        leaf.scale.setScalar(ring.scale);
        leaf.rotation.y = -angle + Math.PI / 2;
        leaf.rotation.x = ring.tiltX;
        succGroup.add(leaf);
      }
    });

    return succGroup;
  }

  // Helper builder: Bonsai Juniper (Composite 8-14 parts)
  function createBonsai(): THREE.Group {
    const bonsaiGroup = new THREE.Group();

    // Sinuous gnarled trunk
    const trunkCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.15, 0.4, 0.1),
      new THREE.Vector3(0.25, 0.8, -0.05),
      new THREE.Vector3(0.1, 1.25, 0.15)
    );
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 20, 0.08, 8, false);
    geometriesToDispose.push(trunkGeo);
    const trunkMesh = new THREE.Mesh(trunkGeo, bonsaiBarkMat);
    trunkMesh.castShadow = !isSoftwareGl;
    bonsaiGroup.add(trunkMesh);

    // Surface roots gripping moss
    for (let r = 0; r < 4; r++) {
      const rootAngle = (r / 4) * Math.PI * 2 + 0.2;
      const rootCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0.04, 0),
        new THREE.Vector3(Math.cos(rootAngle) * 0.18, 0.03, Math.sin(rootAngle) * 0.18),
        new THREE.Vector3(Math.cos(rootAngle) * 0.38, 0.01, Math.sin(rootAngle) * 0.38)
      );
      const rootGeo = new THREE.TubeGeometry(rootCurve, 10, 0.035, 6, false);
      geometriesToDispose.push(rootGeo);
      const rootMesh = new THREE.Mesh(rootGeo, bonsaiBarkMat);
      bonsaiGroup.add(rootMesh);
    }

    // Branching tiers & foliage pads
    const boughs = [
      { start: 0.55, dir: new THREE.Vector3(-0.45, 0.65, 0.3), padScale: new THREE.Vector3(0.38, 0.16, 0.32) },
      { start: 0.75, dir: new THREE.Vector3(0.48, 0.88, -0.2), padScale: new THREE.Vector3(0.42, 0.18, 0.36) },
      { start: 0.95, dir: new THREE.Vector3(-0.35, 1.15, -0.25), padScale: new THREE.Vector3(0.35, 0.15, 0.3) },
      { start: 1.0, dir: new THREE.Vector3(0.05, 1.35, 0.18), padScale: new THREE.Vector3(0.46, 0.22, 0.42) },
    ];

    boughs.forEach((bough, idx) => {
      const pt = trunkCurve.getPoint(bough.start);
      const branchCurve = new THREE.LineCurve3(pt, bough.dir);
      const branchGeo = new THREE.TubeGeometry(branchCurve, 8, 0.04, 6, false);
      geometriesToDispose.push(branchGeo);
      const branchMesh = new THREE.Mesh(branchGeo, bonsaiBarkMat);
      bonsaiGroup.add(branchMesh);

      // Cloud foliage canopy cluster
      const padGeo = new THREE.SphereGeometry(1, 12, 10);
      geometriesToDispose.push(padGeo);
      const padMesh = new THREE.Mesh(padGeo, idx % 2 === 0 ? foliageMat1 : foliageMat2);
      padMesh.position.copy(bough.dir);
      padMesh.scale.copy(bough.padScale);
      padMesh.castShadow = !isSoftwareGl;
      bonsaiGroup.add(padMesh);
    });

    return bonsaiGroup;
  }

  // Helper builder: Bioluminescent Mycena Mushrooms (Composite 6-10 parts)
  function createMushrooms(): { group: THREE.Group; updateBiolum: (i: number) => void } {
    const shroomGroup = new THREE.Group();

    const mushroomMat = new THREE.MeshStandardMaterial({
      color: 0x9beedb,
      emissive: 0x2af0c8,
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
    });
    materialsToDispose.push(mushroomMat);

    const stemMatShroom = new THREE.MeshStandardMaterial({
      color: 0xddf8f0,
      emissive: 0x18bca0,
      emissiveIntensity: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.88,
    });
    materialsToDispose.push(stemMatShroom);

    // Dynamic point light for glowing night ambiance
    const glowLight = new THREE.PointLight(0x2af0c8, 0.8, 1.8, 2);
    glowLight.position.set(0, 0.35, 0);
    shroomGroup.add(glowLight);

    // Cluster of 3 varying caps
    const caps = [
      { x: 0, z: 0, height: 0.42, capRadius: 0.16, tilt: 0.12 },
      { x: 0.12, z: 0.08, height: 0.3, capRadius: 0.12, tilt: -0.2 },
      { x: -0.1, z: 0.07, height: 0.22, capRadius: 0.09, tilt: 0.25 },
    ];

    caps.forEach(c => {
      // Slender curving stem
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(c.x, 0.02, c.z),
        new THREE.Vector3(c.x + c.tilt * 0.4, c.height * 0.6, c.z),
        new THREE.Vector3(c.x + c.tilt, c.height, c.z)
      );
      const stemGeo = new THREE.TubeGeometry(curve, 10, 0.016, 6, false);
      geometriesToDispose.push(stemGeo);
      const stem = new THREE.Mesh(stemGeo, stemMatShroom);
      shroomGroup.add(stem);

      // Bell cap
      const capPoints = [
        new THREE.Vector2(0, c.height + c.capRadius * 0.8),
        new THREE.Vector2(c.capRadius * 0.3, c.height + c.capRadius * 0.75),
        new THREE.Vector2(c.capRadius * 0.7, c.height + c.capRadius * 0.5),
        new THREE.Vector2(c.capRadius * 0.95, c.height + c.capRadius * 0.15),
        new THREE.Vector2(c.capRadius, c.height),
        new THREE.Vector2(c.capRadius * 0.7, c.height - 0.01),
        new THREE.Vector2(0, c.height),
      ];
      const capGeo = new THREE.LatheGeometry(capPoints, 16);
      geometriesToDispose.push(capGeo);
      const cap = new THREE.Mesh(capGeo, mushroomMat);
      cap.position.x = c.x + c.tilt;
      cap.position.z = c.z;
      shroomGroup.add(cap);
    });

    const updateBiolum = (intensity: number) => {
      mushroomMat.emissiveIntensity = 0.2 + intensity * 1.6;
      stemMatShroom.emissiveIntensity = 0.1 + intensity * 0.9;
      glowLight.intensity = intensity * 1.5;
    };

    return { group: shroomGroup, updateBiolum };
  }

  // Helper builder: Alpine Bellflower (Composite 5-8 parts)
  function createFlower(): THREE.Group {
    const flowerGroup = new THREE.Group();

    // Stem
    const stemCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(0.04, 0.25, -0.02),
      new THREE.Vector3(0.08, 0.45, 0.05)
    );
    const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.012, 6, false);
    geometriesToDispose.push(stemGeo);
    const stem = new THREE.Mesh(stemGeo, flowerStemMat);
    flowerGroup.add(stem);

    // Basal leaves
    const leafGeo = new THREE.ConeGeometry(0.06, 0.22, 5);
    leafGeo.scale(1, 1, 0.2);
    geometriesToDispose.push(leafGeo);
    const bl1 = new THREE.Mesh(leafGeo, flowerStemMat);
    bl1.position.set(0.02, 0.08, 0);
    bl1.rotation.z = -0.7;
    flowerGroup.add(bl1);

    // Nodding Bell Blossom
    const bellPoints = [
      new THREE.Vector2(0.015, 0.08),
      new THREE.Vector2(0.04, 0.05),
      new THREE.Vector2(0.08, 0.0),
      new THREE.Vector2(0.095, -0.06),
      new THREE.Vector2(0.06, -0.07),
    ];
    const bellGeo = new THREE.LatheGeometry(bellPoints, 12);
    geometriesToDispose.push(bellGeo);
    const bell = new THREE.Mesh(bellGeo, flowerPetalMat);
    bell.position.set(0.08, 0.44, 0.05);
    bell.rotation.x = Math.PI * 0.75;
    flowerGroup.add(bell);

    return flowerGroup;
  }

  // Helper builder: Cushion Moss Pillow
  function createMossPillow(): THREE.Group {
    const group = new THREE.Group();
    const mossGeo = new THREE.SphereGeometry(0.24, 12, 8);
    mossGeo.scale(1.2, 0.4, 1.0);
    geometriesToDispose.push(mossGeo);
    const mesh = new THREE.Mesh(mossGeo, mossMat);
    mesh.position.y = 0.05;
    group.add(mesh);
    return group;
  }

  // Instantiate each item from the layout
  floraList.forEach((item, index) => {
    let floraObj: THREE.Group;
    let biolumUpdater: ((i: number) => void) | undefined;

    switch (item.species.category) {
      case 'fern':
        floraObj = createFern();
        break;
      case 'succulent':
        floraObj = createSucculent();
        break;
      case 'bonsai':
        floraObj = createBonsai();
        break;
      case 'mushroom': {
        const shroomRig = createMushrooms();
        floraObj = shroomRig.group;
        biolumUpdater = shroomRig.updateBiolum;
        break;
      }
      case 'flower':
        floraObj = createFlower();
        break;
      case 'moss':
      default:
        floraObj = createMossPillow();
        break;
    }

    floraObj.position.set(item.position[0], item.position[1] + 0.65, item.position[2]);
    floraObj.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
    floraObj.scale.setScalar(item.scale);

    // Tag for raycasting & user interaction
    floraObj.userData = { floraItem: item };
    interactiveMeshes.push(floraObj);
    rootGroup.add(floraObj);

    animatedFlora.push({
      mesh: floraObj,
      baseRotZ: floraObj.rotation.z,
      baseRotX: floraObj.rotation.x,
      phase: index * 1.3,
      freq: 1.5 + (index % 3) * 0.5,
      updateBiolum: biolumUpdater,
    });
  });

  // Scatter decorative smooth tumbled river rocks
  const rockGeos = [
    new THREE.DodecahedronGeometry(0.14, 1),
    new THREE.DodecahedronGeometry(0.18, 1),
    new THREE.DodecahedronGeometry(0.11, 1),
  ];
  rockGeos.forEach(g => geometriesToDispose.push(g));

  const rockCount = 9;
  for (let i = 0; i < rockCount; i++) {
    const angle = (i / rockCount) * Math.PI * 2 + 0.4;
    const dist = 0.6 + (i % 4) * 0.32;
    const gIndex = i % rockGeos.length;
    const rock = new THREE.Mesh(rockGeos[gIndex], stoneMat);
    rock.position.set(Math.cos(angle) * dist, 0.72, Math.sin(angle) * dist);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.scale.set(1.2, 0.6, 0.9);
    rock.castShadow = !isSoftwareGl;
    rock.receiveShadow = !isSoftwareGl;
    rootGroup.add(rock);
  }

  const update = (time: number, windSpeed: number, biolumIntensity: number) => {
    // Gentle natural sway physics
    animatedFlora.forEach(item => {
      const sway = Math.sin(time * item.freq + item.phase) * (0.04 * (0.2 + windSpeed));
      item.mesh.rotation.z = item.baseRotZ + sway;
      item.mesh.rotation.x = item.baseRotX + sway * 0.5;

      if (item.updateBiolum) {
        item.updateBiolum(biolumIntensity);
      }
    });
  };

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose());
    materialsToDispose.forEach(m => m.dispose());
    leafTexture.dispose();
    barkTexture.dispose();
  };

  return {
    group: rootGroup,
    interactiveMeshes,
    update,
    dispose,
  };
}
