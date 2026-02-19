import { useState, useCallback, useRef, useEffect } from 'react';
// framer-motion removed — using CSS animations for performance
import confetti from 'canvas-confetti';
import { useScreenScale } from '@/hooks/useScreenScale';

interface OperatorChaosProps {
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  operatorCount?: number;
  maxNumber?: number;
  tier?: number;
  overclockFactor?: number;
}

type Operator = '+' | '-' | '×' | '÷';

interface Question {
  numbers: number[];
  operators: Operator[];
  result: number;
  displayParts: (string | '?')[];
  hasParentheses?: boolean;
  parenGroup?: 'left' | 'right' | 'split';
}

interface TierConfig {
  operatorCount: number;
  maxNumber: number;
  timer: number;
  includeParentheses: boolean;
}

const TIER_CONFIGS: Record<number, TierConfig> = {
  1: { operatorCount: 1, maxNumber: 20, timer: 8, includeParentheses: false },
  2: { operatorCount: 2, maxNumber: 30, timer: 10, includeParentheses: false },
  3: { operatorCount: 2, maxNumber: 45, timer: 14, includeParentheses: true },
  4: { operatorCount: 2, maxNumber: 60, timer: 16, includeParentheses: true },
  5: { operatorCount: 3, maxNumber: 80, timer: 20, includeParentheses: true },
};

const OPERATORS: Operator[] = ['+', '-', '×', '÷'];

const GOLD = 'hsl(45, 90%, 55%)';

const evaluate = (a: number, op: Operator, b: number): number => {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return a / b;
  }
};

// Curated pool of known-good two-operator questions (left-to-right evaluation)
const CURATED_TWO_OP: { numbers: number[]; operators: Operator[]; result: number }[] = [
  { numbers: [6, 3, 4], operators: ['×', '+'], result: 22 },
  { numbers: [8, 2, 5], operators: ['÷', '+'], result: 9 },
  { numbers: [10, 3, 2], operators: ['-', '×'], result: 14 },
  { numbers: [12, 4, 3], operators: ['÷', '×'], result: 9 },
  { numbers: [15, 5, 2], operators: ['-', '÷'], result: 5 },
  { numbers: [7, 3, 2], operators: ['+', '×'], result: 20 },
  { numbers: [9, 3, 6], operators: ['÷', '+'], result: 9 },
  { numbers: [20, 4, 3], operators: ['-', '×'], result: 48 },
  { numbers: [8, 4, 2], operators: ['×', '÷'], result: 16 },
  { numbers: [5, 3, 4], operators: ['+', '-'], result: 4 },
  { numbers: [6, 2, 7], operators: ['×', '-'], result: 5 },
  { numbers: [18, 6, 2], operators: ['÷', '+'], result: 5 },
  { numbers: [4, 5, 2], operators: ['×', '+'], result: 22 },
  { numbers: [16, 8, 3], operators: ['÷', '×'], result: 6 },
  { numbers: [9, 4, 5], operators: ['+', '-'], result: 8 },
  // Harder questions with bigger numbers and varied operations
  { numbers: [14, 7, 6], operators: ['×', '-'], result: 92 },    // 14×7-6 = 92
  { numbers: [36, 9, 5], operators: ['÷', '+'], result: 9 },     // 36÷9+5 = 9
  { numbers: [25, 8, 3], operators: ['-', '×'], result: 51 },    // (25-8)×3 = 51 — left-to-right: 17×3 = 51
  { numbers: [11, 4, 7], operators: ['×', '+'], result: 51 },    // 11×4+7 = 51
  { numbers: [48, 6, 3], operators: ['÷', '×'], result: 24 },    // 48÷6×3 = 24
  { numbers: [30, 12, 3], operators: ['-', '÷'], result: 6 },    // 30-12=18, 18÷3=6
  { numbers: [30, 12, 6], operators: ['-', '÷'], result: 3 },    // 30-12=18, 18÷6=3
  { numbers: [15, 3, 8], operators: ['×', '-'], result: 37 },    // 15×3-8 = 37
  { numbers: [42, 7, 9], operators: ['÷', '+'], result: 15 },    // 42÷7+9 = 15
  { numbers: [13, 6, 4], operators: ['+', '×'], result: 76 },    // 13+6=19, 19×4 = 76
  { numbers: [56, 8, 3], operators: ['÷', '+'], result: 10 },    // 56÷8+3 = 10
  { numbers: [9, 8, 5], operators: ['×', '-'], result: 67 },     // 9×8-5 = 67
  { numbers: [72, 9, 4], operators: ['÷', '×'], result: 32 },    // 72÷9=8, 8×4 = 32
  { numbers: [40, 15, 5], operators: ['-', '÷'], result: 5 },    // 40-15=25, 25÷5 = 5
  { numbers: [17, 3, 9], operators: ['×', '-'], result: 42 },    // 17×3-9 = 42
  { numbers: [11, 7, 6], operators: ['+', '×'], result: 108 },   // 11+7=18, 18×6 = 108
];

// Curated pool for parenthesized questions
const CURATED_PAREN_LEFT: { numbers: number[]; operators: Operator[]; result: number }[] = [
  // (a op1 b) op2 c — left group
  { numbers: [3, 4, 5], operators: ['+', '×'], result: 35 },     // (3+4)×5 = 35
  { numbers: [10, 2, 3], operators: ['-', '×'], result: 24 },    // (10-2)×3 = 24
  { numbers: [8, 4, 2], operators: ['+', '÷'], result: 6 },      // (8+4)÷2 = 6
  { numbers: [15, 5, 2], operators: ['-', '×'], result: 20 },    // (15-5)×2 = 20
  { numbers: [6, 3, 3], operators: ['×', '-'], result: 15 },     // (6×3)-3 = 15
  { numbers: [20, 4, 2], operators: ['-', '÷'], result: 8 },     // (20-4)÷2 = 8
  { numbers: [7, 5, 4], operators: ['+', '-'], result: 8 },      // (7+5)-4 = 8
  { numbers: [9, 3, 2], operators: ['÷', '+'], result: 5 },      // (9÷3)+2 = 5
  // Harder questions with bigger numbers
  { numbers: [18, 6, 4], operators: ['+', '×'], result: 96 },    // (18+6)×4 = 96
  { numbers: [25, 7, 3], operators: ['-', '×'], result: 54 },    // (25-7)×3 = 54
  { numbers: [36, 12, 4], operators: ['+', '÷'], result: 12 },   // (36+12)÷4 = 12
  { numbers: [40, 15, 5], operators: ['-', '×'], result: 125 },  // (40-15)×5 = 125
  { numbers: [8, 7, 6], operators: ['×', '-'], result: 50 },     // (8×7)-6 = 50
  { numbers: [50, 14, 9], operators: ['-', '÷'], result: 4 },    // (50-14)÷9 = 4
  { numbers: [13, 11, 7], operators: ['+', '-'], result: 17 },   // (13+11)-7 = 17
  { numbers: [72, 8, 3], operators: ['÷', '+'], result: 12 },    // (72÷8)+3 = 12
  { numbers: [11, 9, 4], operators: ['+', '×'], result: 80 },    // (11+9)×4 = 80
  { numbers: [60, 24, 6], operators: ['-', '÷'], result: 6 },    // (60-24)÷6 = 6
];

const CURATED_PAREN_RIGHT: { numbers: number[]; operators: Operator[]; result: number }[] = [
  // a op1 (b op2 c) — right group
  { numbers: [5, 3, 2], operators: ['×', '+'], result: 25 },     // 5×(3+2) = 25
  { numbers: [30, 8, 3], operators: ['-', '×'], result: 6 },     // 30-(8×3) = 6
  { numbers: [4, 9, 2], operators: ['×', '-'], result: 28 },     // 4×(9-2) = 28
  { numbers: [2, 6, 3], operators: ['×', '+'], result: 18 },     // 2×(6+3) = 18
  { numbers: [48, 4, 2], operators: ['÷', '+'], result: 8 },     // 48÷(4+2) = 8
  { numbers: [10, 3, 2], operators: ['+', '×'], result: 16 },    // 10+(3×2) = 16
  { numbers: [20, 4, 3], operators: ['-', '+'], result: 13 },    // 20-(4+3) = 13
  { numbers: [36, 4, 3], operators: ['÷', '×'], result: 3 },     // 36÷(4×3) = 3
  { numbers: [5, 8, 2], operators: ['+', '÷'], result: 9 },      // 5+(8÷2) = 9
  { numbers: [100, 6, 4], operators: ['-', '×'], result: 76 },   // 100-(6×4) = 76
  { numbers: [50, 10, 5], operators: ['-', '+'], result: 35 },   // 50-(10+5) = 35
  { numbers: [7, 8, 3], operators: ['×', '-'], result: 35 },     // 7×(8-3) = 35
  // Harder questions with bigger numbers
  { numbers: [6, 12, 5], operators: ['×', '+'], result: 102 },   // 6×(12+5) = 102
  { numbers: [84, 7, 5], operators: ['÷', '+'], result: 7 },     // 84÷(7+5) = 7
  { numbers: [90, 15, 6], operators: ['-', '×'], result: 0 },    // 90-(15×6) = 0
  { numbers: [3, 14, 5], operators: ['×', '+'], result: 57 },    // 3×(14+5) = 57
  { numbers: [80, 12, 7], operators: ['-', '+'], result: 61 },   // 80-(12+7) = 61
  { numbers: [9, 11, 4], operators: ['×', '-'], result: 63 },    // 9×(11-4) = 63
].filter(q => {
  // pre-filter: only keep positive integers
  const r = q.result;
  return Number.isInteger(r) && r >= 0;
});

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateSingleOperator = (maxNum: number): Question => {
  const op = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
  let a: number, b: number, result: number;

  switch (op) {
    case '+':
      a = randInt(1, maxNum);
      b = randInt(1, maxNum);
      result = a + b;
      break;
    case '-':
      a = randInt(Math.floor(maxNum / 2), maxNum);
      b = randInt(1, Math.floor(maxNum / 2));
      if (a < b) [a, b] = [b, a];
      result = a - b;
      break;
    case '×':
      a = randInt(2, Math.min(15, maxNum));
      b = randInt(2, Math.min(15, maxNum));
      result = a * b;
      break;
    case '÷':
      b = randInt(2, Math.min(12, maxNum));
      result = randInt(2, Math.min(12, maxNum));
      a = b * result;
      break;
    default:
      a = 5; b = 3; result = 8;
  }

  return {
    numbers: [a, b],
    operators: [op],
    result,
    displayParts: [`${a}`, '?', `${b}`, '=', `${result}`],
  };
};

const generateTwoOperator = (maxNum: number): Question => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const op1 = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
    const op2 = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
    let a: number, b: number, c: number;

    // Generate numbers tailored to the operator pair
    // For first operator
    if (op1 === '÷') {
      b = randInt(2, 8);
      const quotient1 = randInt(2, Math.floor(maxNum / b));
      a = b * quotient1;
    } else if (op1 === '×') {
      a = randInt(2, Math.min(10, maxNum));
      b = randInt(2, Math.min(10, maxNum));
    } else if (op1 === '-') {
      a = randInt(Math.floor(maxNum / 3), maxNum);
      b = randInt(1, Math.floor(a / 2));
    } else {
      a = randInt(1, Math.floor(maxNum / 2));
      b = randInt(1, Math.floor(maxNum / 2));
    }

    const intermediate = evaluate(a, op1, b);

    // For second operator, generate c based on what works with intermediate
    if (op2 === '÷') {
      // c must divide intermediate evenly, intermediate must be positive
      if (intermediate <= 1 || !Number.isInteger(intermediate)) continue;
      // find divisors of intermediate (2..min(10, intermediate))
      const divisors: number[] = [];
      for (let d = 2; d <= Math.min(10, intermediate); d++) {
        if (intermediate % d === 0) divisors.push(d);
      }
      if (divisors.length === 0) continue;
      c = divisors[Math.floor(Math.random() * divisors.length)];
    } else if (op2 === '×') {
      if (!Number.isInteger(intermediate) || intermediate < 0) continue;
      c = randInt(2, Math.min(8, Math.floor(200 / Math.max(1, Math.abs(intermediate)))));
      if (c < 2) c = 2;
    } else if (op2 === '-') {
      if (!Number.isInteger(intermediate) || intermediate < 1) continue;
      c = randInt(1, Math.min(intermediate, maxNum));
    } else {
      // addition
      c = randInt(1, Math.floor(maxNum / 2));
    }

    const result = evaluate(intermediate, op2, c);

    // Validate: positive integer, not too big, not trivially small
    if (!Number.isInteger(result) || result < 0 || result > 200) continue;
    if (!Number.isInteger(intermediate)) continue;

    return {
      numbers: [a, b, c],
      operators: [op1, op2],
      result,
      displayParts: [`${a}`, '?', `${b}`, '?', `${c}`, '=', `${result}`],
    };
  }

  // All retries failed: use curated pool
  const curated = CURATED_TWO_OP[Math.floor(Math.random() * CURATED_TWO_OP.length)];
  return {
    numbers: [...curated.numbers],
    operators: [...curated.operators],
    result: curated.result,
    displayParts: [
      `${curated.numbers[0]}`, '?', `${curated.numbers[1]}`, '?', `${curated.numbers[2]}`, '=', `${curated.result}`,
    ],
  };
};

const generateParenthesized = (maxNum: number): Question => {
  const parenGroup: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';

  for (let attempt = 0; attempt < 10; attempt++) {
    const op1 = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
    const op2 = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
    let a: number, b: number, c: number, result: number;

    if (parenGroup === 'left') {
      // (a op1 b) op2 c
      // Generate a, b for op1
      if (op1 === '÷') {
        b = randInt(2, 8);
        const q = randInt(2, Math.floor(maxNum / b));
        a = b * q;
      } else if (op1 === '×') {
        a = randInt(2, Math.min(10, maxNum));
        b = randInt(2, Math.min(10, maxNum));
      } else if (op1 === '-') {
        a = randInt(Math.floor(maxNum / 3), maxNum);
        b = randInt(1, Math.floor(a / 2));
      } else {
        a = randInt(1, Math.floor(maxNum / 2));
        b = randInt(1, Math.floor(maxNum / 2));
      }

      const inner = evaluate(a, op1, b);
      if (!Number.isInteger(inner) || inner < 0) continue;

      // Generate c for op2
      if (op2 === '÷') {
        if (inner <= 1) continue;
        const divisors: number[] = [];
        for (let d = 2; d <= Math.min(10, inner); d++) {
          if (inner % d === 0) divisors.push(d);
        }
        if (divisors.length === 0) continue;
        c = divisors[Math.floor(Math.random() * divisors.length)];
      } else if (op2 === '×') {
        c = randInt(2, Math.min(8, Math.floor(200 / Math.max(1, inner))));
        if (c < 2) c = 2;
      } else if (op2 === '-') {
        if (inner < 1) continue;
        c = randInt(1, Math.min(inner, maxNum));
      } else {
        c = randInt(1, Math.floor(maxNum / 2));
      }

      result = evaluate(inner, op2, c);

      if (!Number.isInteger(result) || result < 0 || result > 200) continue;

      return {
        numbers: [a, b, c],
        operators: [op1, op2],
        result,
        displayParts: ['(', `${a}`, '?', `${b}`, ')', '?', `${c}`, '=', `${result}`],
        hasParentheses: true,
        parenGroup: 'left',
      };
    } else {
      // a op1 (b op2 c)
      // Generate b, c for op2 first
      if (op2 === '÷') {
        c = randInt(2, 8);
        const q = randInt(2, Math.floor(maxNum / c));
        b = c * q;
      } else if (op2 === '×') {
        b = randInt(2, Math.min(10, maxNum));
        c = randInt(2, Math.min(10, maxNum));
      } else if (op2 === '-') {
        b = randInt(Math.floor(maxNum / 4), maxNum);
        c = randInt(1, Math.floor(b / 2));
      } else {
        b = randInt(1, Math.floor(maxNum / 2));
        c = randInt(1, Math.floor(maxNum / 2));
      }

      const inner = evaluate(b, op2, c);
      if (!Number.isInteger(inner) || inner < 0) continue;

      // Generate a for op1
      if (op1 === '÷') {
        if (inner <= 0) continue;
        // a must be divisible by inner
        const multiplier = randInt(2, Math.min(8, Math.floor(200 / Math.max(1, inner))));
        if (multiplier < 1) continue;
        a = inner * multiplier;
      } else if (op1 === '×') {
        a = randInt(2, Math.min(10, Math.floor(200 / Math.max(1, inner))));
        if (a < 2) a = 2;
      } else if (op1 === '-') {
        a = randInt(inner + 1, inner + maxNum);
      } else {
        a = randInt(1, Math.floor(maxNum / 2));
      }

      result = evaluate(a, op1, inner);

      if (!Number.isInteger(result) || result < 0 || result > 200) continue;

      return {
        numbers: [a, b, c],
        operators: [op1, op2],
        result,
        displayParts: [`${a}`, '?', '(', `${b}`, '?', `${c}`, ')', '=', `${result}`],
        hasParentheses: true,
        parenGroup: 'right',
      };
    }
  }

  // Fallback: curated parenthesized
  if (parenGroup === 'left') {
    const curated = CURATED_PAREN_LEFT[Math.floor(Math.random() * CURATED_PAREN_LEFT.length)];
    return {
      numbers: [...curated.numbers],
      operators: [...curated.operators],
      result: curated.result,
      displayParts: [
        '(', `${curated.numbers[0]}`, '?', `${curated.numbers[1]}`, ')', '?', `${curated.numbers[2]}`, '=', `${curated.result}`,
      ],
      hasParentheses: true,
      parenGroup: 'left',
    };
  } else {
    const pool = CURATED_PAREN_RIGHT.length > 0 ? CURATED_PAREN_RIGHT : CURATED_PAREN_LEFT;
    const curated = pool[Math.floor(Math.random() * pool.length)];
    if (pool === CURATED_PAREN_RIGHT) {
      return {
        numbers: [...curated.numbers],
        operators: [...curated.operators],
        result: curated.result,
        displayParts: [
          `${curated.numbers[0]}`, '?', '(', `${curated.numbers[1]}`, '?', `${curated.numbers[2]}`, ')', '=', `${curated.result}`,
        ],
        hasParentheses: true,
        parenGroup: 'right',
      };
    }
    // fallback to left-grouped curated
    return {
      numbers: [...curated.numbers],
      operators: [...curated.operators],
      result: curated.result,
      displayParts: [
        '(', `${curated.numbers[0]}`, '?', `${curated.numbers[1]}`, ')', '?', `${curated.numbers[2]}`, '=', `${curated.result}`,
      ],
      hasParentheses: true,
      parenGroup: 'left',
    };
  }
};


// Curated pool of three-operator questions evaluated left-to-right: ((a op1 b) op2 c) op3 d
// Each has a unique operator combination that produces the given result
const CURATED_THREE_OP_FLAT: { numbers: number[]; operators: Operator[]; result: number }[] = [
  { numbers: [8, 2, 3, 4], operators: ['+', '×', '-'], result: 26 },      // (8+2)×3-4=26
  { numbers: [5, 3, 2, 4], operators: ['+', '×', '-'], result: 12 },      // (5+3)×2-4=12
  { numbers: [10, 2, 3, 1], operators: ['×', '-', '+'], result: 18 },     // 10×2-3+1=18
  { numbers: [15, 3, 4, 2], operators: ['÷', '×', '+'], result: 22 },     // 15÷3×4+2=22
  { numbers: [6, 4, 5, 10], operators: ['×', '-', '+'], result: 29 },     // 6×4-5+10=29
  { numbers: [18, 6, 2, 7], operators: ['÷', '+', '×'], result: 35 },     // 18÷6+2×7=35
  { numbers: [7, 3, 4, 6], operators: ['+', '×', '-'], result: 34 },      // (7+3)×4-6=34
  { numbers: [24, 6, 3, 5], operators: ['÷', '×', '+'], result: 17 },     // 24÷6×3+5=17
  { numbers: [30, 5, 2, 8], operators: ['÷', '×', '-'], result: 4 },      // 30÷5×2-8=4
  { numbers: [8, 5, 3, 6], operators: ['×', '-', '+'], result: 43 },      // 8×5-3+6=43
  { numbers: [7, 2, 5, 3], operators: ['×', '+', '-'], result: 16 },      // 7×2+5-3=16
  { numbers: [36, 6, 4, 3], operators: ['÷', '+', '×'], result: 30 },     // 36÷6+4×3=30
  { numbers: [14, 2, 3, 5], operators: ['÷', '+', '×'], result: 50 },     // 14÷2+3×5=50
  { numbers: [11, 3, 4, 2], operators: ['+', '×', '÷'], result: 28 },     // (11+3)×4÷2=28
  { numbers: [40, 8, 3, 7], operators: ['÷', '×', '-'], result: 8 },      // 40÷8×3-7=8
  { numbers: [6, 5, 4, 3], operators: ['+', '-', '×'], result: 21 },      // (6+5-4)×3=21
  { numbers: [48, 8, 2, 9], operators: ['÷', '×', '+'], result: 21 },     // 48÷8×2+9=21
  { numbers: [9, 4, 3, 2], operators: ['+', '-', '×'], result: 20 },      // (9+4-3)×2=20
  { numbers: [25, 5, 6, 4], operators: ['÷', '+', '×'], result: 44 },     // 25÷5+6×4=44
  { numbers: [42, 7, 3, 5], operators: ['÷', '×', '-'], result: 13 },     // 42÷7×3-5=13
  { numbers: [15, 7, 4, 3], operators: ['-', '×', '+'], result: 35 },     // (15-7)×4+3=35
  { numbers: [50, 10, 3, 6], operators: ['÷', '+', '×'], result: 48 },    // 50÷10+3×6=48
  { numbers: [5, 6, 7, 3], operators: ['+', '-', '×'], result: 12 },      // (5+6-7)×3=12
  { numbers: [60, 12, 3, 7], operators: ['÷', '+', '×'], result: 56 },    // 60÷12+3×7=56
];

// Curated pool of three-operator questions with split parentheses: (a op1 b) op2 (c op3 d)
const CURATED_THREE_OP_PAREN: { numbers: number[]; operators: Operator[]; result: number }[] = [
  { numbers: [3, 4, 8, 2], operators: ['+', '×', '-'], result: 42 },      // (3+4)×(8-2)=42
  { numbers: [10, 3, 5, 2], operators: ['-', '×', '+'], result: 49 },     // (10-3)×(5+2)=49
  { numbers: [12, 4, 6, 3], operators: ['÷', '+', '×'], result: 21 },     // (12÷4)+(6×3)=21
  { numbers: [8, 3, 15, 5], operators: ['+', '×', '-'], result: 110 },    // (8+3)×(15-5)=110
  { numbers: [9, 6, 4, 2], operators: ['-', '×', '+'], result: 18 },      // (9-6)×(4+2)=18
  { numbers: [6, 5, 9, 3], operators: ['+', '×', '-'], result: 66 },      // (6+5)×(9-3)=66
  { numbers: [4, 3, 7, 2], operators: ['×', '+', '-'], result: 17 },      // (4×3)+(7-2)=17
  { numbers: [15, 9, 8, 2], operators: ['-', '×', '÷'], result: 24 },     // (15-9)×(8÷2)=24
  { numbers: [18, 3, 4, 1], operators: ['÷', '×', '+'], result: 30 },     // (18÷3)×(4+1)=30
  { numbers: [10, 7, 6, 2], operators: ['-', '×', '+'], result: 24 },     // (10-7)×(6+2)=24
  { numbers: [5, 3, 12, 4], operators: ['+', '×', '-'], result: 64 },     // (5+3)×(12-4)=64
  { numbers: [7, 4, 8, 5], operators: ['×', '-', '+'], result: 15 },      // (7×4)-(8+5)=15
  { numbers: [11, 3, 6, 2], operators: ['+', '×', '-'], result: 56 },     // (11+3)×(6-2)=56
  { numbers: [42, 6, 3, 4], operators: ['÷', '+', '×'], result: 19 },     // (42÷6)+(3×4)=19
  { numbers: [8, 6, 12, 3], operators: ['-', '×', '÷'], result: 8 },      // (8-6)×(12÷3)=8
  { numbers: [50, 10, 7, 4], operators: ['÷', '×', '-'], result: 15 },    // (50÷10)×(7-4)=15
  { numbers: [3, 5, 9, 1], operators: ['+', '×', '-'], result: 64 },      // (3+5)×(9-1)=64
];

const generateThreeOperator = (_maxNum: number, includeParentheses: boolean): Question => {
  if (includeParentheses && Math.random() < 0.5) {
    // Use split-parenthesized pattern: (a op1 b) op2 (c op3 d)
    const curated = CURATED_THREE_OP_PAREN[Math.floor(Math.random() * CURATED_THREE_OP_PAREN.length)];
    return {
      numbers: [...curated.numbers],
      operators: [...curated.operators],
      result: curated.result,
      displayParts: [
        '(', `${curated.numbers[0]}`, '?', `${curated.numbers[1]}`, ')',
        '?',
        '(', `${curated.numbers[2]}`, '?', `${curated.numbers[3]}`, ')',
        '=', `${curated.result}`,
      ],
      hasParentheses: true,
      parenGroup: 'split',
    };
  }

  // Use flat left-to-right pattern: ((a op1 b) op2 c) op3 d
  const curated = CURATED_THREE_OP_FLAT[Math.floor(Math.random() * CURATED_THREE_OP_FLAT.length)];
  return {
    numbers: [...curated.numbers],
    operators: [...curated.operators],
    result: curated.result,
    displayParts: [
      `${curated.numbers[0]}`, '?', `${curated.numbers[1]}`, '?',
      `${curated.numbers[2]}`, '?', `${curated.numbers[3]}`,
      '=', `${curated.result}`,
    ],
  };
};

const generateQuestion = (operatorCount: number, maxNum: number, includeParentheses: boolean): Question => {
  if (operatorCount === 1) {
    return generateSingleOperator(maxNum);
  }
  if (operatorCount >= 3) {
    return generateThreeOperator(maxNum, includeParentheses);
  }
  if (includeParentheses) {
    return generateParenthesized(maxNum);
  }
  return generateTwoOperator(maxNum);
};

const evaluateWithParentheses = (
  numbers: number[],
  operators: Operator[],
  parenGroup?: 'left' | 'right' | 'split'
): number => {
  if (operators.length === 1) {
    return evaluate(numbers[0], operators[0], numbers[1]);
  }

  // Three-operator equations (4 numbers, 3 operators)
  if (operators.length === 3) {
    const [a, b, c, d] = numbers;
    const [op1, op2, op3] = operators;

    if (parenGroup === 'split') {
      // (a op1 b) op2 (c op3 d)
      const left = evaluate(a, op1, b);
      const right = evaluate(c, op3, d);
      return evaluate(left, op2, right);
    }
    // Default: left-to-right ((a op1 b) op2 c) op3 d
    const step1 = evaluate(a, op1, b);
    const step2 = evaluate(step1, op2, c);
    return evaluate(step2, op3, d);
  }

  // Two-operator equations (3 numbers, 2 operators)
  const [a, b, c] = numbers;
  const [op1, op2] = operators;

  if (parenGroup === 'left') {
    const inner = evaluate(a, op1, b);
    return evaluate(inner, op2, c);
  } else if (parenGroup === 'right') {
    const inner = evaluate(b, op2, c);
    return evaluate(a, op1, inner);
  }
  // Default: left-to-right
  const intermediate = evaluate(a, op1, b);
  return evaluate(intermediate, op2, c);
};

export const OperatorChaos = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  operatorCount,
  maxNumber,
  tier = 1,
  overclockFactor = 1,
}: OperatorChaosProps) => {
  // Resolve tier config, with prop overrides
  const tierConfig = TIER_CONFIGS[Math.min(Math.max(tier, 1), 5)] || TIER_CONFIGS[1];
  const effectiveOpCount = operatorCount != null
    ? operatorCount + (overclockFactor > 1.3 ? 1 : 0)
    : tierConfig.operatorCount;
  const effectiveMaxNumber = maxNumber != null
    ? Math.floor(maxNumber * overclockFactor)
    : Math.floor(tierConfig.maxNumber * overclockFactor);
  const timerDuration = tierConfig.timer;
  const includeParentheses = tierConfig.includeParentheses;

  const { s } = useScreenScale();
  const [question, setQuestion] = useState<Question>(() =>
    generateQuestion(effectiveOpCount, effectiveMaxNumber, includeParentheses)
  );
  const [selectedOperators, setSelectedOperators] = useState<Operator[]>([]);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [questionKey, setQuestionKey] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);

  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);
  const timerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs for callback props (avoid restarting timer on every render)
  const onAnswerRef = useRef(onAnswer);
  const playSoundRef = useRef(playSound);
  const triggerHapticRef = useRef(triggerHaptic);
  const onScreenShakeRef = useRef(onScreenShake);
  onAnswerRef.current = onAnswer;
  playSoundRef.current = playSound;
  triggerHapticRef.current = triggerHaptic;
  onScreenShakeRef.current = onScreenShake;

  const totalSlots = question.operators.length;

  // Timer expiry — single setTimeout per question
  useEffect(() => {
    if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    timerTimeoutRef.current = setTimeout(() => {
      if (!isProcessing.current) {
        isProcessing.current = true;
        playSoundRef.current('wrong');
        triggerHapticRef.current('heavy');
        onScreenShakeRef.current();
        setLastFeedback('wrong');
        setStreak(0);
        onAnswerRef.current(false, 0, tier);

        setTimeout(() => {
          setQuestion(generateQuestion(effectiveOpCount, effectiveMaxNumber, includeParentheses));
          setSelectedOperators([]);
          setCurrentSlot(0);
          setQuestionKey(k => k + 1);
          questionStartTime.current = Date.now();
          setLastFeedback(null);
          isProcessing.current = false;
        }, 200);
      }
    }, timerDuration * 1000);
    return () => {
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    };
  }, [questionKey, timerDuration, effectiveOpCount, effectiveMaxNumber, includeParentheses, tier]);

  const handleOperatorSelect = useCallback((op: Operator) => {
    if (isProcessing.current) return;

    const newSelected = [...selectedOperators, op];
    setSelectedOperators(newSelected);

    // If all slots filled, check answer
    if (newSelected.length === totalSlots) {
      isProcessing.current = true;
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);

      const responseTime = Date.now() - questionStartTime.current;
      const speedBonus = Math.max(0, Math.floor((timerDuration * 1000 - responseTime) / 100));

      // Check if operators match — evaluate the equation with selected operators
      const selectedResult = evaluateWithParentheses(
        question.numbers,
        newSelected,
        question.parenGroup
      );
      const isCorrect = Math.abs(selectedResult - question.result) < 0.0001;

      if (isCorrect) {
        playSound('correct');
        triggerHaptic('light');
        setLastFeedback('correct');
        setStreak(s => s + 1);

        confetti({
          particleCount: 12,
          spread: 50,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FF8C00'],
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
        setStreak(0);
      }

      onAnswer(isCorrect, speedBonus, tier);

      // Next question
      setTimeout(() => {
        setQuestion(generateQuestion(effectiveOpCount, effectiveMaxNumber, includeParentheses));
        setSelectedOperators([]);
        setCurrentSlot(0);
        setQuestionKey(k => k + 1);
        questionStartTime.current = Date.now();
        setLastFeedback(null);
        isProcessing.current = false;
      }, 200);
    } else {
      setCurrentSlot(currentSlot + 1);
      playSound('tick');
    }
  }, [selectedOperators, totalSlots, question, effectiveOpCount, effectiveMaxNumber, includeParentheses, onAnswer, playSound, triggerHaptic, onScreenShake, currentSlot, tier]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Operator> = {
        '+': '+',
        '-': '-',
        '*': '×',
        'x': '×',
        '/': '÷',
        'd': '÷',
      };

      if (keyMap[e.key]) {
        handleOperatorSelect(keyMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOperatorSelect]);

  const renderEquation = () => {
    let slotIndex = 0;

    // Count total characters in displayParts for dynamic sizing
    const totalChars = question.displayParts.reduce((sum, part) => sum + part.length, 0);
    const isLongEquation = question.displayParts.length >= 7;
    const textSizeClass = isLongEquation ? 'text-2xl' : 'text-3xl';
    const parenSizeClass = isLongEquation ? 'text-2xl' : 'text-3xl';

    return question.displayParts.map((part, i) => {
      if (part === '?') {
        const thisSlotIndex = slotIndex;
        const selected = selectedOperators[thisSlotIndex];
        const isCurrentSlot = thisSlotIndex === currentSlot && !selected;
        slotIndex++;

        return (
          <div
            key={`slot-${i}`}
            className="rounded-xl border-2 flex items-center justify-center mx-1 flex-shrink-0"
            style={{
              width: isLongEquation ? s(44) : s(56),
              height: isLongEquation ? s(44) : s(56),
              background: selected
                ? 'linear-gradient(135deg, hsl(45, 90%, 55% / 0.3), hsl(45, 90%, 55% / 0.1))'
                : 'hsl(0, 0%, 10%)',
              borderColor: isCurrentSlot ? GOLD : 'hsl(45, 90%, 55% / 0.4)',
              animation: isCurrentSlot ? 'slot-pulse 0.5s ease-in-out infinite' : 'none',
            }}
          >
            <span className={`${isLongEquation ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: GOLD }}>
              {selected || '?'}
            </span>
          </div>
        );
      }

      // Parentheses styling
      if (part === '(' || part === ')') {
        return (
          <span
            key={`paren-${i}`}
            className={`${parenSizeClass} font-mono font-bold mx-0.5 flex-shrink-0`}
            style={{ color: 'hsl(45, 90%, 55% / 0.6)' }}
          >
            {part}
          </span>
        );
      }

      return (
        <span
          key={`part-${i}`}
          className={`${textSizeClass} font-mono font-bold mx-1 flex-shrink-0`}
          style={{ color: part === '=' ? 'hsl(0, 0%, 50%)' : 'hsl(0, 0%, 90%)' }}
        >
          {part}
        </span>
      );
    });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8">
      {/* Timer bar CSS animation */}
      <style>{`
        @keyframes timer-shrink {
          from { width: 100%; background: linear-gradient(90deg, hsl(45, 90%, 55%), hsl(35, 90%, 50%)); }
          50% { background: linear-gradient(90deg, hsl(30, 90%, 50%), hsl(15, 80%, 50%)); }
          75% { background: linear-gradient(90deg, hsl(10, 80%, 50%), hsl(0, 70%, 45%)); }
          to { width: 0%; background: linear-gradient(90deg, hsl(0, 70%, 45%), hsl(0, 60%, 40%)); }
        }
        @keyframes slot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes oc-equation-in-anim {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .oc-equation-in { animation: oc-equation-in-anim 0.2s ease-out forwards; }
      `}</style>

      {/* Instructions */}
      <div className="text-center mb-4 oc-equation-in">
        <div className="text-xs uppercase tracking-[0.3em] text-game-direction/70 mb-2">
          Operator Chaos
        </div>
        <div className="text-sm text-muted-foreground">
          Find the missing operator{totalSlots > 1 ? 's' : ''}
        </div>
      </div>

      {/* Streak Combo Indicator */}
      <div className="h-8 mb-2 flex items-center justify-center">
        {streak >= 2 && (
          <div
            key={`streak-${streak}`}
            className="text-sm font-black uppercase tracking-wider oc-equation-in"
            style={{
              color: GOLD,
              textShadow: `0 0 12px hsl(45, 90%, 55% / 0.6), 0 0 24px hsl(45, 90%, 55% / 0.3)`,
            }}
          >
            x{streak} COMBO
          </div>
        )}
      </div>

      {/* Timer Bar */}
      <div className="w-full mb-6" style={{ maxWidth: s(320) }}>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'hsl(0, 0%, 15%)' }}
        >
          <div
            key={questionKey}
            className="h-full rounded-full"
            style={{
              animation: `timer-shrink ${timerDuration}s linear forwards`,
              boxShadow: '0 0 8px hsl(45, 90%, 55% / 0.3)',
            }}
          />
        </div>
      </div>

      {/* Equation Display */}
      <div
        key={questionKey}
        className="flex items-center justify-center flex-nowrap p-6 rounded-2xl border border-border/30 bg-card/30 mb-10 min-w-0 w-full whitespace-nowrap overflow-hidden oc-equation-in"
        style={{
          maxWidth: s(384),
          boxShadow: lastFeedback === 'correct'
            ? '0 0 40px hsl(45, 90%, 55% / 0.5)'
            : lastFeedback === 'wrong'
            ? '0 0 40px hsl(0, 70%, 50% / 0.5)'
            : '0 0 20px hsl(45, 90%, 55% / 0.2)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {renderEquation()}
      </div>

      {/* Operator Buttons */}
      <div className="grid grid-cols-4 gap-3 w-full" style={{ maxWidth: s(320) }}>
        {OPERATORS.map((op) => (
          <button
            key={op}
            onClick={() => handleOperatorSelect(op)}
            disabled={isProcessing.current}
            className="rounded-xl text-3xl font-bold border-2 active:scale-[0.92] hover:scale-105"
            style={{
              height: s(72),
              background: 'linear-gradient(135deg, hsl(45, 90%, 55% / 0.15), hsl(45, 90%, 55% / 0.05))',
              borderColor: 'hsl(45, 90%, 55% / 0.5)',
              color: GOLD,
              boxShadow: '0 0 15px hsl(45, 90%, 55% / 0.2)',
              transition: 'transform 100ms ease',
            }}
          >
            {op}
          </button>
        ))}
      </div>

      {/* Spacer for layout balance */}
      <div className="mt-8" />
    </div>
  );
};
