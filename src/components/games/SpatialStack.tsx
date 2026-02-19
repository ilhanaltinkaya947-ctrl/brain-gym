import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useScreenScale } from '@/hooks/useScreenScale';

interface SpatialStackProps {
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  cubeCount?: number;
  tier?: number;
  overclockFactor?: number;
}

interface Cube {
  x: number;
  y: number;
  z: number;
  isHidden?: boolean;
}

interface Question {
  visibleCubes: Cube[];
  totalCount: number;
  viewAngle: number;
}

type StructureType = 'pyramid' | 'tower' | 'bridge' | 'l-shape' | 'staircase' | 'cross' | 'zigzag';

// Tier-based configuration
const TIER_CONFIG: Record<number, { min: number; max: number; speedBonusWindow: number }> = {
  1: { min: 4, max: 6, speedBonusWindow: 6000 },
  2: { min: 6, max: 9, speedBonusWindow: 5500 },
  3: { min: 8, max: 12, speedBonusWindow: 5000 },
  4: { min: 10, max: 15, speedBonusWindow: 4500 },
  5: { min: 12, max: 18, speedBonusWindow: 4000 },
};

const getTierConfig = (tier: number) => {
  return TIER_CONFIG[Math.min(Math.max(tier, 1), 5)] ?? TIER_CONFIG[1];
};

// Clamp cube count hint to tier range
const clampToTierRange = (hint: number, tier: number): number => {
  const config = getTierConfig(tier);
  return Math.min(config.max, Math.max(config.min, hint));
};

// Generate a random view angle for tier 4+
const generateViewAngle = (tier: number): number => {
  if (tier <= 3) return 0;
  const range = tier >= 5 ? 15 : 10;
  return (Math.random() * 2 - 1) * range;
};

// Structured shape generators
const generatePyramid = (targetCount: number): Cube[] => {
  const cubes: Cube[] = [];

  // Bottom layer: up to 3x3
  const baseSize = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(targetCount))));
  for (let x = 0; x < baseSize && cubes.length < targetCount; x++) {
    for (let y = 0; y < baseSize && cubes.length < targetCount; y++) {
      cubes.push({ x, y, z: 0 });
    }
  }

  // Middle layer: smaller footprint (offset inward)
  if (cubes.length < targetCount && baseSize >= 2) {
    const midSize = baseSize - 1;
    for (let x = 0; x < midSize && cubes.length < targetCount; x++) {
      for (let y = 0; y < midSize && cubes.length < targetCount; y++) {
        cubes.push({ x, y, z: 1 });
      }
    }
  }

  // Top layer: single cube or 1x1
  if (cubes.length < targetCount && baseSize >= 3) {
    cubes.push({ x: 0, y: 0, z: 2 });
  }

  // If we still need more cubes, extend the base or add more supported cubes
  let z = 0;
  while (cubes.length < targetCount) {
    const existing = cubes.filter(c => c.z === z);
    let added = false;
    for (const ec of existing) {
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nx = ec.x + dx;
        const ny = ec.y + dy;
        if (nx >= 0 && ny >= 0 && nx <= 4 && ny <= 4) {
          if (!cubes.some(c => c.x === nx && c.y === ny && c.z === z)) {
            if (z === 0 || cubes.some(c => c.x === nx && c.y === ny && c.z === z - 1)) {
              cubes.push({ x: nx, y: ny, z });
              added = true;
              if (cubes.length >= targetCount) break;
            }
          }
        }
      }
      if (cubes.length >= targetCount) break;
    }
    if (!added) z = (z + 1 <= 3) ? z + 1 : 0;
    // Safety valve
    if (cubes.length >= targetCount) break;
    if (z > 3) break;
  }

  return cubes.slice(0, targetCount);
};

const generateTower = (targetCount: number): Cube[] => {
  const cubes: Cube[] = [];
  const baseWidth = Math.random() > 0.5 ? 2 : 1;
  const baseDepth = baseWidth === 1 ? (Math.random() > 0.5 ? 2 : 1) : 1;

  let z = 0;
  while (cubes.length < targetCount) {
    for (let x = 0; x < baseWidth && cubes.length < targetCount; x++) {
      for (let y = 0; y < baseDepth && cubes.length < targetCount; y++) {
        cubes.push({ x, y, z });
      }
    }
    z++;
    if (z > 10) break; // safety
  }

  // If tower is too tall and we still need cubes, widen a layer
  if (cubes.length < targetCount) {
    for (let layer = 0; cubes.length < targetCount && layer <= z; layer++) {
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const nx = baseWidth - 1 + dx;
        const ny = baseDepth - 1 + dy;
        if (!cubes.some(c => c.x === nx && c.y === ny && c.z === layer)) {
          if (layer === 0 || cubes.some(c => c.x === nx && c.y === ny && c.z === layer - 1)) {
            cubes.push({ x: nx, y: ny, z: layer });
          }
        }
        if (cubes.length >= targetCount) break;
      }
      if (cubes.length >= targetCount) break;
    }
  }

  return cubes.slice(0, targetCount);
};

const generateBridge = (targetCount: number): Cube[] => {
  const cubes: Cube[] = [];

  // Two columns separated by a gap
  const colHeight = Math.max(2, Math.ceil(targetCount / 5));
  const gap = 2; // gap between columns

  // Left column
  for (let z = 0; z < colHeight && cubes.length < targetCount; z++) {
    cubes.push({ x: 0, y: 0, z });
  }

  // Right column
  for (let z = 0; z < colHeight && cubes.length < targetCount; z++) {
    cubes.push({ x: gap, y: 0, z });
  }

  // Bridge top connecting them
  const bridgeZ = colHeight - 1;
  for (let x = 1; x < gap && cubes.length < targetCount; x++) {
    cubes.push({ x, y: 0, z: bridgeZ });
  }

  // Add depth to columns and bridge for more cubes
  for (let y = 1; cubes.length < targetCount && y <= 2; y++) {
    for (let z = 0; z < colHeight && cubes.length < targetCount; z++) {
      cubes.push({ x: 0, y, z });
    }
    for (let z = 0; z < colHeight && cubes.length < targetCount; z++) {
      cubes.push({ x: gap, y, z });
    }
    for (let x = 1; x < gap && cubes.length < targetCount; x++) {
      cubes.push({ x, y, z: bridgeZ });
    }
  }

  // Fill remaining cubes with supported positions
  let attempts = 0;
  while (cubes.length < targetCount && attempts < 100) {
    attempts++;
    const base = cubes[Math.floor(Math.random() * cubes.length)];
    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1]];
    const [dx, dy, dz] = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = base.x + dx;
    const ny = base.y + dy;
    const nz = base.z + dz;
    if (nx >= 0 && ny >= 0 && nz >= 0 && nx <= 4 && ny <= 4 && nz <= 6) {
      if (!cubes.some(c => c.x === nx && c.y === ny && c.z === nz)) {
        if (nz === 0 || cubes.some(c => c.x === nx && c.y === ny && c.z === nz - 1)) {
          cubes.push({ x: nx, y: ny, z: nz });
        }
      }
    }
  }

  return cubes.slice(0, targetCount);
};

const generateLShape = (targetCount: number): Cube[] => {
  const cubes: Cube[] = [];

  // Bottom layer: L-shape pattern
  const armLength = Math.max(2, Math.ceil(targetCount / 4));

  // Horizontal arm of L
  for (let x = 0; x < armLength && cubes.length < targetCount; x++) {
    cubes.push({ x, y: 0, z: 0 });
  }

  // Vertical arm of L (from corner going up in y)
  for (let y = 1; y < armLength && cubes.length < targetCount; y++) {
    cubes.push({ x: 0, y, z: 0 });
  }

  // Stack cubes on the corner (x=0, y=0) going up
  for (let z = 1; cubes.length < targetCount && z <= 4; z++) {
    cubes.push({ x: 0, y: 0, z });
    // Optionally extend upper layers along arms
    if (cubes.length < targetCount && z <= 2) {
      cubes.push({ x: 1, y: 0, z });
    }
    if (cubes.length < targetCount && z <= 2) {
      cubes.push({ x: 0, y: 1, z });
    }
  }

  // Add depth if still need more cubes
  for (let y = 0; cubes.length < targetCount && y < armLength; y++) {
    for (let x = 0; x < armLength && cubes.length < targetCount; x++) {
      if (!cubes.some(c => c.x === x && c.y === y && c.z === 0)) {
        // Only add adjacent to existing cubes
        const adjacent = cubes.some(c =>
          c.z === 0 && ((c.x === x + 1 && c.y === y) || (c.x === x - 1 && c.y === y) ||
          (c.x === x && c.y === y + 1) || (c.x === x && c.y === y - 1))
        );
        if (adjacent) {
          cubes.push({ x, y, z: 0 });
        }
      }
    }
  }

  // Fill remaining with supported upper cubes
  let attempts = 0;
  while (cubes.length < targetCount && attempts < 100) {
    attempts++;
    const base = cubes[Math.floor(Math.random() * cubes.length)];
    const nz = base.z + 1;
    if (nz <= 5 && !cubes.some(c => c.x === base.x && c.y === base.y && c.z === nz)) {
      cubes.push({ x: base.x, y: base.y, z: nz });
    }
  }

  return cubes.slice(0, targetCount);
};

const generateStaircase = (targetCount: number): Cube[] => {
  const cubes: Cube[] = [];
  const steps = Math.max(2, Math.min(5, Math.ceil(targetCount / 3)));

  for (let step = 0; step < steps && cubes.length < targetCount; step++) {
    // Each step is a column of height (step + 1) at x = step
    for (let z = 0; z <= step && cubes.length < targetCount; z++) {
      cubes.push({ x: step, y: 0, z });
    }
  }

  // Add depth (y) to fill remaining cubes
  for (let dy = 1; cubes.length < targetCount && dy <= 3; dy++) {
    for (let step = 0; step < steps && cubes.length < targetCount; step++) {
      for (let z = 0; z <= step && cubes.length < targetCount; z++) {
        if (!cubes.some(c => c.x === step && c.y === dy && c.z === z)) {
          cubes.push({ x: step, y: dy, z });
        }
      }
    }
  }

  return cubes.slice(0, targetCount);
};

const generateCross = (targetCount: number): Cube[] => {
  const cubes: Cube[] = [];
  const armLen = Math.max(1, Math.ceil((targetCount - 1) / 4));

  // Center column
  cubes.push({ x: 0, y: 0, z: 0 });

  // Arms in 4 directions
  for (let i = 1; i <= armLen && cubes.length < targetCount; i++) {
    cubes.push({ x: i, y: 0, z: 0 });
  }
  for (let i = 1; i <= armLen && cubes.length < targetCount; i++) {
    cubes.push({ x: -i, y: 0, z: 0 });
  }
  for (let i = 1; i <= armLen && cubes.length < targetCount; i++) {
    cubes.push({ x: 0, y: i, z: 0 });
  }
  for (let i = 1; i <= armLen && cubes.length < targetCount; i++) {
    cubes.push({ x: 0, y: -i, z: 0 });
  }

  // Stack center upward
  for (let z = 1; cubes.length < targetCount && z <= 4; z++) {
    cubes.push({ x: 0, y: 0, z });
  }

  // Widen arms or add more height if still short
  let attempts = 0;
  while (cubes.length < targetCount && attempts < 100) {
    attempts++;
    const base = cubes[Math.floor(Math.random() * cubes.length)];
    const nz = base.z + 1;
    if (nz <= 5 && !cubes.some(c => c.x === base.x && c.y === base.y && c.z === nz)) {
      cubes.push({ x: base.x, y: base.y, z: nz });
    }
  }

  return cubes.slice(0, targetCount);
};

const generateZigzag = (targetCount: number): Cube[] => {
  const cubes: Cube[] = [];
  const cols = Math.max(3, Math.min(6, Math.ceil(targetCount / 2)));

  for (let x = 0; x < cols && cubes.length < targetCount; x++) {
    // Alternating heights: even columns tall, odd columns short
    const height = x % 2 === 0 ? Math.min(3, Math.ceil(targetCount / cols)) : 1;
    for (let z = 0; z < height && cubes.length < targetCount; z++) {
      cubes.push({ x, y: 0, z });
    }
  }

  // Add depth to fill remaining
  for (let dy = 1; cubes.length < targetCount && dy <= 3; dy++) {
    for (let x = 0; x < cols && cubes.length < targetCount; x++) {
      const existingHeight = Math.max(0, ...cubes.filter(c => c.x === x && c.y === 0).map(c => c.z)) + 1;
      for (let z = 0; z < existingHeight && cubes.length < targetCount; z++) {
        if (!cubes.some(c => c.x === x && c.y === dy && c.z === z)) {
          cubes.push({ x, y: dy, z });
        }
      }
    }
  }

  return cubes.slice(0, targetCount);
};

// A cube is fully hidden in isometric view if all 3 visible faces are blocked:
// - top face blocked by cube at (x, y, z+1)
// - left face blocked by cube at (x, y+1, z)
// - right face blocked by cube at (x+1, y, z)
const isFullyOccluded = (cube: Cube, cubeSet: Set<string>): boolean => {
  return (
    cubeSet.has(`${cube.x},${cube.y},${cube.z + 1}`) &&
    cubeSet.has(`${cube.x},${cube.y + 1},${cube.z}`) &&
    cubeSet.has(`${cube.x + 1},${cube.y},${cube.z}`)
  );
};

const markHiddenCubes = (cubes: Cube[]): Cube[] => {
  const cubeSet = new Set(cubes.map(c => `${c.x},${c.y},${c.z}`));
  return cubes.map(c => ({
    ...c,
    isHidden: isFullyOccluded(c, cubeSet),
  }));
};

const ensureSupport = (cubes: Cube[]): Cube[] => {
  const cubeSet = new Set(cubes.map(c => `${c.x},${c.y},${c.z}`));
  const result = [...cubes];
  for (const c of cubes) {
    for (let z = 0; z < c.z; z++) {
      const key = `${c.x},${c.y},${z}`;
      if (!cubeSet.has(key)) {
        result.push({ x: c.x, y: c.y, z });
        cubeSet.add(key);
      }
    }
  }
  return result;
};

// Main stack generation using structured shapes
const generateStack = (targetCount: number, tier: number): Question => {
  const structures: StructureType[] = ['pyramid', 'tower', 'bridge', 'l-shape', 'staircase', 'cross', 'zigzag'];
  const structure = structures[Math.floor(Math.random() * structures.length)];

  let cubes: Cube[];
  switch (structure) {
    case 'pyramid':
      cubes = generatePyramid(targetCount);
      break;
    case 'tower':
      cubes = generateTower(targetCount);
      break;
    case 'bridge':
      cubes = generateBridge(targetCount);
      break;
    case 'l-shape':
      cubes = generateLShape(targetCount);
      break;
    case 'staircase':
      cubes = generateStaircase(targetCount);
      break;
    case 'cross':
      cubes = generateCross(targetCount);
      break;
    case 'zigzag':
      cubes = generateZigzag(targetCount);
      break;
  }

  // Fill support gaps — every cube at z > 0 gets full column support below
  cubes = ensureSupport(cubes);

  // Clamp to tier range after support fill
  const config = getTierConfig(tier);
  const finalCount = Math.min(config.max, Math.max(config.min, cubes.length));
  cubes = cubes.slice(0, finalCount);

  // If we have fewer than needed, pad with supported cubes
  let attempts = 0;
  while (cubes.length < finalCount && attempts < 200) {
    attempts++;
    const base = cubes[Math.floor(Math.random() * cubes.length)];
    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1]];
    const [dx, dy, dz] = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = base.x + dx;
    const ny = base.y + dy;
    const nz = base.z + dz;
    if (nx >= 0 && ny >= 0 && nz >= 0 && nx <= 5 && ny <= 5 && nz <= 6) {
      if (!cubes.some(c => c.x === nx && c.y === ny && c.z === nz)) {
        if (nz === 0 || cubes.some(c => c.x === nx && c.y === ny && c.z === nz - 1)) {
          cubes.push({ x: nx, y: ny, z: nz });
        }
      }
    }
  }

  cubes = cubes.slice(0, finalCount);

  // Mark hidden cubes (fully occluded) — they'll render as ghost wireframes
  const allCubes = markHiddenCubes(cubes);

  const viewAngle = generateViewAngle(tier);

  return {
    visibleCubes: allCubes,  // ALL cubes, some with isHidden=true
    totalCount: allCubes.length,
    viewAngle,
  };
};

// Convert 3D position to 2D isometric position with optional view angle rotation
// Uses Math.round to snap to half-pixels — eliminates sub-pixel gaps between cubes
const R2 = (n: number) => Math.round(n * 100) / 100;
const SQRT3_2 = 0.8660254; // sqrt(3)/2 — exact constant avoids repeated computation

const toIsometric = (x: number, y: number, z: number, size: number, viewAngleDeg: number) => {
  let isoX = (x - y) * size * SQRT3_2;
  let isoY = (x + y) * size * 0.5 - z * size;

  if (viewAngleDeg !== 0) {
    const rad = (viewAngleDeg * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const rotatedX = isoX * cosA - isoY * sinA;
    const rotatedY = isoX * sinA + isoY * cosA;
    isoX = rotatedX;
    isoY = rotatedY;
  }

  return { isoX: R2(isoX), isoY: R2(isoY) };
};

// Generate grid floor diamond points at z=0
const generateGridFloor = (cubes: Cube[], size: number, viewAngleDeg: number): string => {
  if (cubes.length === 0) return '';

  const minX = Math.min(...cubes.map(c => c.x));
  const maxX = Math.max(...cubes.map(c => c.x));
  const minY = Math.min(...cubes.map(c => c.y));
  const maxY = Math.max(...cubes.map(c => c.y));

  // Extend floor by 0.5 beyond the base area
  const floorMinX = minX - 0.5;
  const floorMaxX = maxX + 1.5;
  const floorMinY = minY - 0.5;
  const floorMaxY = maxY + 1.5;

  // Diamond corners in isometric space
  const topCorner = toIsometric(floorMinX, floorMinY, 0, size, viewAngleDeg);
  const rightCorner = toIsometric(floorMaxX, floorMinY, 0, size, viewAngleDeg);
  const bottomCorner = toIsometric(floorMaxX, floorMaxY, 0, size, viewAngleDeg);
  const leftCorner = toIsometric(floorMinX, floorMaxY, 0, size, viewAngleDeg);

  // Shift down to sit at the base of cubes (z=0 bottom face)
  const offset = size * 0.5;

  return `M ${topCorner.isoX} ${topCorner.isoY + offset}
          L ${rightCorner.isoX} ${rightCorner.isoY + offset}
          L ${bottomCorner.isoX} ${bottomCorner.isoY + offset}
          L ${leftCorner.isoX} ${leftCorner.isoY + offset}
          Z`;
};

// Generate grid lines for the floor
const generateGridLines = (cubes: Cube[], size: number, viewAngleDeg: number): string[] => {
  if (cubes.length === 0) return [];

  const minX = Math.min(...cubes.map(c => c.x));
  const maxX = Math.max(...cubes.map(c => c.x));
  const minY = Math.min(...cubes.map(c => c.y));
  const maxY = Math.max(...cubes.map(c => c.y));

  const lines: string[] = [];
  const offset = size * 0.5;

  // Lines along X axis
  for (let x = minX; x <= maxX + 1; x++) {
    const start = toIsometric(x, minY - 0.5, 0, size, viewAngleDeg);
    const end = toIsometric(x, maxY + 1.5, 0, size, viewAngleDeg);
    lines.push(`M ${start.isoX} ${start.isoY + offset} L ${end.isoX} ${end.isoY + offset}`);
  }

  // Lines along Y axis
  for (let y = minY; y <= maxY + 1; y++) {
    const start = toIsometric(minX - 0.5, y, 0, size, viewAngleDeg);
    const end = toIsometric(maxX + 1.5, y, 0, size, viewAngleDeg);
    lines.push(`M ${start.isoX} ${start.isoY + offset} L ${end.isoX} ${end.isoY + offset}`);
  }

  return lines;
};

export const SpatialStack = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  cubeCount = 5,
  tier = 1,
  overclockFactor = 1,
}: SpatialStackProps) => {
  const effectiveTier = Math.min(Math.max(tier, 1), 5);
  const effectiveCubeCount = clampToTierRange(
    cubeCount + (overclockFactor > 1.3 ? 2 : 0),
    effectiveTier
  );
  const interQuestionDelay = effectiveTier >= 3 ? 150 : 200;
  const tierConfig = getTierConfig(effectiveTier);

  const { s } = useScreenScale();
  const [question, setQuestion] = useState<Question>(() => generateStack(effectiveCubeCount, effectiveTier));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [questionKey, setQuestionKey] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);

  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);

  // Generate 6 multiple-choice options (correct + 5 distractors)
  const answerOptions = useMemo(() => {
    const correct = question.totalCount;
    const options = new Set<number>([correct]);
    // Add nearby numbers as distractors
    const candidates = [correct - 1, correct + 1, correct - 2, correct + 2, correct - 3, correct + 3, correct - 4, correct + 4];
    for (const c of candidates) {
      if (options.size >= 6) break;
      if (c >= 1) options.add(c);
    }
    // Fill to 6 if needed
    let offset = 5;
    while (options.size < 6) {
      if (correct + offset >= 1) options.add(correct + offset);
      if (correct - offset >= 1) options.add(correct - offset);
      offset++;
    }
    // Shuffle options so the correct answer isn't always in the same position
    const arr = Array.from(options).slice(0, 6);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [question.totalCount]);

  // Sort cubes for proper rendering order (back to front, bottom to top)
  const sortedCubes = useMemo(() => {
    return [...question.visibleCubes].sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;
      return (a.x + a.y) - (b.x + b.y);
    });
  }, [question.visibleCubes]);

  const handleAnswerSelect = useCallback((answer: number) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    setSelectedAnswer(answer);

    const responseTime = Date.now() - questionStartTime.current;
    const speedBonus = Math.max(0, Math.floor((tierConfig.speedBonusWindow - responseTime) / 100));

    const isCorrect = answer === question.totalCount;

    if (isCorrect) {
      playSound('correct');
      triggerHaptic('light');
      setLastFeedback('correct');

      confetti({
        particleCount: 15,
        spread: 50,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#00FF00', '#32CD32', '#7CFC00'],
        scalar: 0.8,
        ticks: 60,
        decay: 0.94,
        disableForReducedMotion: true,
      });
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      setLastFeedback('wrong');
    }

    onAnswer(isCorrect, speedBonus, effectiveTier);

    // Next question
    setTimeout(() => {
      setQuestion(generateStack(effectiveCubeCount, effectiveTier));
      setSelectedAnswer(null);
      setQuestionKey(k => k + 1);
      questionStartTime.current = Date.now();
      setLastFeedback(null);
      isProcessing.current = false;
    }, interQuestionDelay);
  }, [question.totalCount, effectiveCubeCount, effectiveTier, interQuestionDelay, tierConfig.speedBonusWindow, onAnswer, playSound, triggerHaptic, onScreenShake]);

  // Keyboard support (answer options only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (!isNaN(num) && answerOptions.includes(num)) {
        handleAnswerSelect(num);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswerSelect, answerOptions]);

  const cubeSize = s(30);

  // Per-layer colors; tier 5 reduces contrast between layers
  const layerColors = useMemo(() => {
    if (effectiveTier >= 5) {
      // Reduced contrast: all layers similar hue/lightness
      return [
        { h: 160, s: 50, l: 44 },
        { h: 165, s: 48, l: 46 },
        { h: 170, s: 46, l: 48 },
        { h: 175, s: 44, l: 50 },
        { h: 178, s: 42, l: 51 },
        { h: 180, s: 40, l: 52 },
        { h: 182, s: 38, l: 53 },
      ];
    }
    return [
      { h: 140, s: 70, l: 40 },  // Layer 0 (bottom): darker green
      { h: 170, s: 65, l: 48 },  // Layer 1: teal-green
      { h: 200, s: 70, l: 55 },  // Layer 2: cyan-blue
      { h: 230, s: 65, l: 58 },  // Layer 3: blue
      { h: 260, s: 60, l: 60 },  // Layer 4: purple-blue
      { h: 280, s: 55, l: 62 },  // Layer 5: purple
      { h: 300, s: 50, l: 64 },  // Layer 6: magenta
    ];
  }, [effectiveTier]);

  // Grid floor data
  const gridFloorPath = useMemo(() =>
    generateGridFloor(question.visibleCubes, cubeSize, question.viewAngle),
    [question.visibleCubes, question.viewAngle]
  );

  const gridLines = useMemo(() =>
    generateGridLines(question.visibleCubes, cubeSize, question.viewAngle),
    [question.visibleCubes, question.viewAngle]
  );

  // Dynamic viewBox — auto-fits any structure (towers, pyramids, bridges, etc.)
  const viewBox = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const cube of question.visibleCubes) {
      const { isoX, isoY } = toIsometric(cube.x, cube.y, cube.z, cubeSize, question.viewAngle);
      minX = Math.min(minX, isoX - cubeSize * 0.866);
      maxX = Math.max(maxX, isoX + cubeSize * 0.866);
      minY = Math.min(minY, isoY - cubeSize * 0.5);
      maxY = Math.max(maxY, isoY + cubeSize * 1.5);
    }

    // Include grid floor extent
    const floorPad = cubeSize * 0.6;
    minX -= floorPad;
    maxX += floorPad;
    maxY += floorPad;

    const pad = 12;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;

    return `${minX - pad} ${minY - pad} ${w} ${h}`;
  }, [question.visibleCubes, question.viewAngle]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8">
      {/* Instructions */}
      <div className="text-center mb-6 ss-fade-in">
        <div className="text-xs uppercase tracking-[0.3em] text-game-pattern/70 mb-2">
          Spatial Stack
        </div>
        <div className="text-sm text-muted-foreground">
          Count every cube — some are hidden
        </div>
      </div>

      {/* Isometric Cube Display */}
        <div
          key={questionKey}
          className="relative mb-6 rounded-2xl border border-border/30 bg-card/30 flex items-center justify-center ss-fade-in"
          style={{
            width: s(288),
            height: s(256),
            boxShadow: lastFeedback === 'correct'
              ? '0 0 50px hsl(140, 70%, 45% / 0.5)'
              : lastFeedback === 'wrong'
              ? '0 0 50px hsl(0, 70%, 50% / 0.5)'
              : '0 0 25px hsl(140, 70%, 45% / 0.2)',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <svg width={s(240)} height={s(220)} viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
            {/* Grid floor */}
            {gridFloorPath && (
              <path
                className="grid-floor"
                d={gridFloorPath}
                fill="hsl(140, 50%, 50%)"
                stroke="none"
              />
            )}
            {gridLines.map((line, i) => (
              <path
                key={`grid-${i}`}
                className="grid-line"
                d={line}
                fill="none"
                stroke="hsl(140, 50%, 50%)"
                strokeWidth="0.5"
              />
            ))}

            {/* Cubes — shared vertex constants for pixel-perfect alignment */}
            {sortedCubes.map((cube, i) => {
              const { isoX, isoY } = toIsometric(cube.x, cube.y, cube.z, cubeSize, question.viewAngle);
              const s = cubeSize;
              const w = R2(s * SQRT3_2); // half-width
              const h = R2(s * 0.5);     // half-height
              const c = layerColors[Math.min(cube.z, layerColors.length - 1)];

              // 6 vertices of isometric cube (shared between faces)
              const top = `${isoX},${R2(isoY - h)}`;
              const right = `${R2(isoX + w)},${isoY}`;
              const mid = `${isoX},${R2(isoY + h)}`;
              const left = `${R2(isoX - w)},${isoY}`;
              const botRight = `${R2(isoX + w)},${R2(isoY + s)}`;
              const botMid = `${isoX},${R2(isoY + h + s)}`;
              const botLeft = `${R2(isoX - w)},${R2(isoY + s)}`;

              const topFace = `M${top} L${right} L${mid} L${left}Z`;
              const leftFace = `M${left} L${mid} L${botMid} L${botLeft}Z`;
              const rightFace = `M${right} L${mid} L${botMid} L${botRight}Z`;

              if (cube.isHidden) {
                // Ghost cube — dashed wireframe, no fill
                const ghostStroke = `hsl(${c.h}, ${c.s}%, ${c.l}%)`;
                return (
                  <g key={`cube-${i}`} style={{ animationDelay: `${i * 0.04}s` }}>
                    <path
                      className="cube-face"
                      style={{ animationDelay: `${i * 0.04}s` }}
                      d={`${topFace} ${leftFace} ${rightFace}`}
                      fill="none"
                      stroke={ghostStroke}
                      strokeWidth="0.4"
                      strokeDasharray="3,2"
                      strokeOpacity={0.3}
                      strokeLinejoin="round"
                    />
                  </g>
                );
              }

              return (
                <g key={`cube-${i}`} style={{ animationDelay: `${i * 0.04}s` }}>
                  <path
                    className="cube-face"
                    style={{ animationDelay: `${i * 0.04}s` }}
                    d={leftFace}
                    fill={`hsl(${c.h}, ${c.s}%, ${c.l - 15}%)`}
                    stroke={`hsl(${c.h}, ${c.s}%, ${c.l - 15}%)`}
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                  />
                  <path
                    className="cube-face"
                    style={{ animationDelay: `${i * 0.04}s` }}
                    d={rightFace}
                    fill={`hsl(${c.h}, ${c.s}%, ${c.l - 5}%)`}
                    stroke={`hsl(${c.h}, ${c.s}%, ${c.l - 5}%)`}
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                  />
                  <path
                    className="cube-face"
                    style={{ animationDelay: `${i * 0.04}s` }}
                    d={topFace}
                    fill={`hsl(${c.h}, ${c.s}%, ${c.l + 10}%)`}
                    stroke={`hsl(${c.h}, ${c.s}%, ${c.l + 10}%)`}
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                  />
                  {/* Edge outlines for depth definition */}
                  <path
                    className="cube-edge"
                    style={{ animationDelay: `${i * 0.04}s` }}
                    d={`M${top} L${right} L${botRight} M${right} L${mid} M${left} L${mid} L${botMid}`}
                    fill="none"
                    stroke={`hsl(${c.h}, ${c.s}%, ${c.l - 25}%)`}
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </svg>
        </div>

      {/* Answer Options - 6 choices */}
      <div className="grid grid-cols-3 gap-2 w-full" style={{ maxWidth: s(320) }}>
        {answerOptions.map((num) => (
          <button
            key={num}
            onClick={() => handleAnswerSelect(num)}
            disabled={isProcessing.current}
            className={`rounded-xl text-xl font-bold border-2 transition-all duration-150 ease-in-out hover:scale-105 active:scale-[0.92] ${
              selectedAnswer === num
                ? num === question.totalCount
                  ? 'border-success bg-success/20 text-success'
                  : 'border-destructive bg-destructive/20 text-destructive'
                : ''
            }`}
            style={{
              height: s(56),
              ...(selectedAnswer !== num ? {
                background: 'linear-gradient(135deg, hsl(140, 70%, 45% / 0.15), hsl(140, 70%, 45% / 0.05))',
                borderColor: 'hsl(140, 70%, 45% / 0.4)',
                color: 'hsl(140, 70%, 55%)',
              } : {}),
            }}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="mt-4 text-xs text-muted-foreground text-center uppercase tracking-wider ss-fade-in" style={{ opacity: 0.5 }}>
        Tap the total cube count
      </p>

      <style>{`
        @keyframes ss-fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .ss-fade-in { animation: ss-fade-in 0.3s ease-out forwards; }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-grid-floor {
          from { opacity: 0; }
          to { opacity: 0.08; }
        }
        @keyframes fade-in-grid-line {
          from { opacity: 0; }
          to { opacity: 0.1; }
        }
        @keyframes fade-in-edge {
          from { opacity: 0; }
          to { opacity: 0.3; }
        }
        .grid-floor {
          opacity: 0;
          animation: fade-in-grid-floor 0.3s ease forwards;
        }
        .grid-line {
          opacity: 0;
          animation: fade-in-grid-line 0.3s ease forwards;
        }
        .cube-face {
          opacity: 0;
          animation: fade-in 0.4s ease forwards;
        }
        .cube-edge {
          opacity: 0;
          animation: fade-in-edge 0.4s ease forwards;
        }
      `}</style>
    </div>
  );
};
