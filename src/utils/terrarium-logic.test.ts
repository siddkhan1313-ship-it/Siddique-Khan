import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHour,
  formatTimeOfDay,
  calculateLighting,
  getWeatherPresetDefaults,
  generateFloraLayout,
} from './terrarium-logic';

test('normalizeHour handles 24h wraps and negative values correctly', () => {
  assert.equal(normalizeHour(12), 12);
  assert.equal(normalizeHour(25), 1);
  assert.equal(normalizeHour(-3), 21);
  assert.equal(normalizeHour(0), 0);
});

test('formatTimeOfDay formats 12h AM/PM strings properly', () => {
  assert.equal(formatTimeOfDay(0), '12:00 AM');
  assert.equal(formatTimeOfDay(6.5), '6:30 AM');
  assert.equal(formatTimeOfDay(12), '12:00 PM');
  assert.equal(formatTimeOfDay(18.75), '6:45 PM');
  assert.equal(formatTimeOfDay(23.5), '11:30 PM');
});

test('calculateLighting provides realistic day and night transitions', () => {
  const noon = calculateLighting(12, 'clear');
  assert.ok(noon.sunIntensity > 1.0, 'Noon should have high sun intensity');
  assert.equal(noon.starsOpacity, 0, 'No stars at solar noon');
  assert.ok(noon.sunPosition[1] > 0, 'Sun should be high in the sky at noon');

  const midnight = calculateLighting(0, 'clear');
  assert.ok(midnight.sunIntensity < 0.2, 'Midnight should have minimal or no direct sun');
  assert.ok(midnight.starsOpacity > 0.8, 'Stars should be prominent at midnight');
  assert.ok(midnight.biolumIntensity > 0.5, 'Bioluminescence should glow at night');

  const sunset = calculateLighting(19, 'clear');
  assert.ok(sunset.sunColor.startsWith('#'), 'Sunset color should be hex string');

  const rainy = calculateLighting(12, 'rain');
  assert.ok(rainy.sunIntensity < noon.sunIntensity, 'Rain should attenuate direct sunlight');
  assert.ok(rainy.fogDensity > noon.fogDensity, 'Rain should increase atmospheric fog density');
});

test('getWeatherPresetDefaults returns appropriate environmental values', () => {
  const rain = getWeatherPresetDefaults('rain');
  assert.ok(rain.rainIntensity > 0.5);
  assert.ok(rain.condensation > 0.5);

  const clear = getWeatherPresetDefaults('clear');
  assert.equal(clear.rainIntensity, 0);
});

test('generateFloraLayout creates deterministic flora within terrarium radius', () => {
  const layoutA = generateFloraLayout('rainforest', 42, 1.0);
  const layoutB = generateFloraLayout('rainforest', 42, 1.0);
  assert.equal(layoutA.length, layoutB.length, 'Same seed produces identical count');
  assert.deepEqual(layoutA[0].position, layoutB[0].position, 'Positions match identically');

  // Verify all plants stay within terrarium circular radius
  for (const item of layoutA) {
    const [x, , z] = item.position;
    const dist = Math.sqrt(x * x + z * z);
    assert.ok(dist <= 2.2, `Plant ${item.id} position (${x}, ${z}) should be inside radius`);
    assert.ok(item.species.name.length > 0);
  }
});
