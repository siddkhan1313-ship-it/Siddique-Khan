import * as THREE from 'three';
import {
  createSoilColorTexture,
  createSoilBumpTexture,
  createWoodBarkTexture,
  createCondensationTexture,
  createContactShadowTexture,
} from './proceduralTextures';

export interface GlassDomeRig {
  group: THREE.Group;
  lidGroup: THREE.Group;
  glassMaterial: THREE.MeshPhysicalMaterial;
  condensationMaterial: THREE.MeshBasicMaterial;
  soilMesh: THREE.Mesh;
  updateCondensation: (amount: number) => void;
  setLidOpen: (open: boolean) => void;
  update: (delta: number) => void;
  dispose: () => void;
}

export function createTerrariumVessel(isSoftwareGl: boolean): GlassDomeRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'TerrariumVessel';

  // 1. Radial Ground Contact Shadow disc
  const shadowGeo = new THREE.PlaneGeometry(6.5, 6.5);
  const shadowTex = createContactShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -0.01;
  rootGroup.add(shadowMesh);

  // 2. Base Pedestal: Turned walnut wood platter with beveled rim
  const woodTexture = createWoodBarkTexture();
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTexture,
    color: 0x3d271d,
    roughness: 0.65,
    metalness: 0.05,
  });

  // Base profile lathe points
  const basePoints: THREE.Vector2[] = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(2.45, 0),
    new THREE.Vector2(2.55, 0.08),
    new THREE.Vector2(2.52, 0.22),
    new THREE.Vector2(2.35, 0.32),
    new THREE.Vector2(2.2, 0.35),
    new THREE.Vector2(2.15, 0.3),
    new THREE.Vector2(0, 0.3),
  ];
  const baseGeo = new THREE.LatheGeometry(basePoints, 48);
  const baseMesh = new THREE.Mesh(baseGeo, woodMat);
  baseMesh.castShadow = !isSoftwareGl;
  baseMesh.receiveShadow = !isSoftwareGl;
  rootGroup.add(baseMesh);

  // 3. Antique Brass Accent Lip Ring
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85,
  });
  const brassRingGeo = new THREE.TorusGeometry(2.25, 0.045, 16, 48);
  const brassRing = new THREE.Mesh(brassRingGeo, brassMat);
  brassRing.rotation.x = Math.PI / 2;
  brassRing.position.y = 0.33;
  brassRing.castShadow = !isSoftwareGl;
  rootGroup.add(brassRing);

  // 4. Substrate Stratification:
  // Layer A: Pebble Drainage Layer (Light river gravel)
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x8a7f76,
    roughness: 0.8,
    metalness: 0.1,
  });
  const pebbleGeo = new THREE.CylinderGeometry(2.1, 2.12, 0.14, 36);
  const pebbleMesh = new THREE.Mesh(pebbleGeo, pebbleMat);
  pebbleMesh.position.y = 0.38;
  rootGroup.add(pebbleMesh);

  // Layer B: Charcoal boundary ring
  const charcoalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.95,
    metalness: 0.05,
  });
  const charcoalGeo = new THREE.CylinderGeometry(2.11, 2.11, 0.06, 36);
  const charcoalMesh = new THREE.Mesh(charcoalGeo, charcoalMat);
  charcoalMesh.position.y = 0.48;
  rootGroup.add(charcoalMesh);

  // Layer C: Rich undulating organic soil mound
  const soilColor = createSoilColorTexture();
  const soilBump = createSoilBumpTexture();
  const soilMat = new THREE.MeshStandardMaterial({
    map: soilColor,
    bumpMap: soilBump,
    bumpScale: 0.04,
    roughness: 0.88,
    metalness: 0.02,
  });

  const soilGeo = new THREE.CylinderGeometry(2.12, 2.12, 0.22, 48, 8);
  // Deform top surface of soil geometry slightly to create natural knolls/hillocks
  const posAttr = soilGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    if (y > 0.05) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const bump = Math.sin(x * 2.5) * 0.06 + Math.cos(z * 3.0) * 0.05 + Math.sin(dist * 2.0) * 0.04;
      posAttr.setY(i, y + bump);
    }
  }
  soilGeo.computeVertexNormals();
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.y = 0.62;
  soilMesh.receiveShadow = !isSoftwareGl;
  rootGroup.add(soilMesh);

  // 5. Glass Bell Jar Dome (Cloche)
  // Lathe silhouette for an elegant apothecary bell jar
  const glassPoints: THREE.Vector2[] = [
    new THREE.Vector2(2.18, 0.4),
    new THREE.Vector2(2.2, 0.6),
    new THREE.Vector2(2.2, 2.3),
    new THREE.Vector2(2.15, 2.8),
    new THREE.Vector2(1.95, 3.4),
    new THREE.Vector2(1.5, 3.9),
    new THREE.Vector2(0.9, 4.25),
    new THREE.Vector2(0.35, 4.45),
    new THREE.Vector2(0.0, 4.5),
  ];
  const glassGeo = new THREE.LatheGeometry(glassPoints, 64);
  glassGeo.computeVertexNormals();

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.05,
    roughness: 0.08,
    transmission: isSoftwareGl ? 0 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.32 : 1.0,
    ior: 1.52,
    thickness: 1.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    depthWrite: false, // Essential for transparency sorting of interior items
    side: THREE.DoubleSide,
  });

  const lidGroup = new THREE.Group();
  lidGroup.name = 'TerrariumLid';
  
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.renderOrder = 10; // Outer glass renders after inner plants
  glassMesh.castShadow = false;
  glassMesh.receiveShadow = !isSoftwareGl;
  lidGroup.add(glassMesh);

  // Brass finial handle atop the bell jar
  const finialPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 4.5),
    new THREE.Vector2(0.28, 4.52),
    new THREE.Vector2(0.22, 4.65),
    new THREE.Vector2(0.12, 4.75),
    new THREE.Vector2(0.25, 4.95),
    new THREE.Vector2(0.18, 5.12),
    new THREE.Vector2(0.0, 5.2),
  ];
  const finialGeo = new THREE.LatheGeometry(finialPoints, 24);
  const finialMesh = new THREE.Mesh(finialGeo, brassMat);
  finialMesh.castShadow = !isSoftwareGl;
  lidGroup.add(finialMesh);

  // Brass base ring on the bottom rim of the bell jar
  const rimRingGeo = new THREE.TorusGeometry(2.19, 0.035, 12, 48);
  const rimRingMesh = new THREE.Mesh(rimRingGeo, brassMat);
  rimRingMesh.rotation.x = Math.PI / 2;
  rimRingMesh.position.y = 0.42;
  lidGroup.add(rimRingMesh);

  // 6. Condensation Layer (Inner sleeve with dynamic droplet map)
  let condensationTexture = createCondensationTexture(0.3);
  const condensationMat = new THREE.MeshBasicMaterial({
    map: condensationTexture,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  // Slightly scaled down inside the glass to prevent z-fighting
  const condGeo = new THREE.LatheGeometry(
    glassPoints.map(p => new THREE.Vector2(p.x * 0.992, p.y)),
    48
  );
  const condMesh = new THREE.Mesh(condGeo, condensationMat);
  condMesh.renderOrder = 9;
  lidGroup.add(condMesh);

  rootGroup.add(lidGroup);

  // Animation state for lid opening/closing
  let targetLidY = 0;
  let targetLidRotZ = 0;
  let currentLidY = 0;
  let currentLidRotZ = 0;

  const setLidOpen = (open: boolean) => {
    targetLidY = open ? 2.5 : 0;
    targetLidRotZ = open ? 0.35 : 0;
  };

  const updateCondensation = (amount: number) => {
    condensationMat.opacity = Math.min(0.85, Math.max(0.05, amount * 0.8));
    if (condensationTexture) {
      condensationTexture.dispose();
    }
    condensationTexture = createCondensationTexture(amount);
    condensationMat.map = condensationTexture;
    condensationMat.needsUpdate = true;
  };

  const update = (delta: number) => {
    // Exponential damping for smooth lid movement
    const dampFactor = 1 - Math.exp(-4 * delta);
    currentLidY += (targetLidY - currentLidY) * dampFactor;
    currentLidRotZ += (targetLidRotZ - currentLidRotZ) * dampFactor;

    lidGroup.position.y = currentLidY;
    lidGroup.rotation.z = currentLidRotZ;
    // Pivot slightly sideways when lifted
    lidGroup.position.x = currentLidRotZ * 1.2;
  };

  const dispose = () => {
    baseGeo.dispose();
    pebbleGeo.dispose();
    charcoalGeo.dispose();
    soilGeo.dispose();
    glassGeo.dispose();
    finialGeo.dispose();
    rimRingGeo.dispose();
    brassRingGeo.dispose();
    condGeo.dispose();
    shadowGeo.dispose();

    woodMat.dispose();
    brassMat.dispose();
    pebbleMat.dispose();
    charcoalMat.dispose();
    soilMat.dispose();
    glassMat.dispose();
    condensationMat.dispose();
    shadowMat.dispose();

    woodTexture.dispose();
    soilColor.dispose();
    soilBump.dispose();
    shadowTex.dispose();
    if (condensationTexture) condensationTexture.dispose();
  };

  return {
    group: rootGroup,
    lidGroup,
    glassMaterial: glassMat,
    condensationMaterial: condensationMat,
    soilMesh,
    updateCondensation,
    setLidOpen,
    update,
    dispose,
  };
}
