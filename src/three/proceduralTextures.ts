import * as THREE from 'three';

/**
 * Creates an organic dark humus potting soil color texture
 */
export function createSoilColorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base rich dark earth
  ctx.fillStyle = '#221812';
  ctx.fillRect(0, 0, 512, 512);

  // Layered soil grain & organic flecks
  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 0.5 + Math.random() * 2.5;
    const shade = Math.random();
    
    if (shade > 0.85) {
      // Tiny decomposed perlite/sand fleck
      ctx.fillStyle = 'rgba(180, 170, 155, 0.4)';
    } else if (shade > 0.4) {
      // Dark humus specks
      ctx.fillStyle = 'rgba(18, 12, 8, 0.5)';
    } else {
      // Peat brown specks
      ctx.fillStyle = 'rgba(65, 45, 30, 0.4)';
    }
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates soil bump map for tactile micro-relief
 */
export function createSoilBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 22000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 0.5 + Math.random() * 2.2;
    const bright = Math.random() > 0.5 ? 255 : 0;
    const alpha = 0.15 + Math.random() * 0.35;
    ctx.fillStyle = `rgba(${bright}, ${bright}, ${bright}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates wood grain texture for the bonsai and base pedestal
 */
export function createWoodBarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm cedar / aged oak base
  ctx.fillStyle = '#4a3224';
  ctx.fillRect(0, 0, 512, 512);

  // Longitudinal wood fiber striations
  for (let i = 0; i < 600; i++) {
    const y = Math.random() * 512;
    const height = 1 + Math.random() * 3;
    const isDark = Math.random() > 0.4;
    ctx.fillStyle = isDark ? 'rgba(38, 22, 14, 0.4)' : 'rgba(102, 70, 50, 0.3)';
    ctx.fillRect(0, y, 512, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates fine leaf venation texture for botanical foliage
 */
export function createLeafTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Fresh chloroplast green gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#5da845');
  grad.addColorStop(0.5, '#42882c');
  grad.addColorStop(1, '#2c611c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Central vein
  ctx.strokeStyle = '#7ec850';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(128, 256);
  ctx.quadraticCurveTo(128, 128, 128, 10);
  ctx.stroke();

  // Lateral secondary veins
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(130, 210, 80, 0.45)';
  for (let y = 30; y < 240; y += 22) {
    ctx.beginPath();
    ctx.moveTo(128, y);
    ctx.quadraticCurveTo(80, y - 20, 20, y - 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(128, y);
    ctx.quadraticCurveTo(176, y - 20, 236, y - 10);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates dynamic condensation water droplet map for the glass jar
 */
export function createCondensationTexture(amount: number = 0.5): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Clear background
  ctx.clearRect(0, 0, 512, 512);

  if (amount > 0.05) {
    // Soft misty background moisture haze
    ctx.fillStyle = `rgba(255, 255, 255, ${0.08 * amount})`;
    ctx.fillRect(0, 0, 512, 512);

    // Discrete condensation droplets
    const dropletCount = Math.floor(amount * 450);
    for (let i = 0; i < dropletCount; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 1.2 + Math.random() * 4.5 * (amount > 0.6 ? 1.5 : 1.0);

      // Droplet shadow/rim
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Occasional vertical micro-trickle run
      if (Math.random() < 0.04 * amount) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(x - 0.75, y, 1.5, 12 + Math.random() * 25);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Soft radial contact shadow texture to ground the terrarium
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 126);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.28)');
  gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.08)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
