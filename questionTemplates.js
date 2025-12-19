/**
 * GMAT Study PWA - Question Templates
 * Version 9.0 - 18 Official GMAT Questions (Parameterized)
 *
 * DEVELOPER NOTES:
 * ================
 *
 * TEMPLATE STRUCTURE:
 * - Each question has `steps[]` for reasoning context (shown but not answered)
 * - `finalQuestion` is what the user actually answers
 * - `finalChoices` and `finalAnswerIndex` define the answer
 * - Parameters regenerate on each quiz attempt
 *
 * PARAMETERIZATION:
 * - generate(rng) creates fresh parameters per attempt
 * - Computed answers always match generated parameters
 * - Constraints ensure valid math (no division by zero, etc.)
 *
 * DISPLAY LOGIC (in app.js):
 * - Steps are shown as context above the final question
 * - User ONLY answers the final question
 * - No intermediate step answering required
 */

(function(global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // SEEDED RNG UTILITIES
  // ═══════════════════════════════════════════════════════════════

  function seedRandom(seed) {
    let s = seed >>> 0;
    return function() {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pickInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function pickFrom(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function shuffle(rng, arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function hashSeed(baseSeed, questionId, attemptNumber) {
    let hash = baseSeed >>> 0;
    const str = `${questionId}_${attemptNumber}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a;
  }

  // ═══════════════════════════════════════════════════════════════
  // 18 OFFICIAL GMAT QUESTION TEMPLATES (Parameterized)
  // ═══════════════════════════════════════════════════════════════

  const QUESTION_TEMPLATES = [

    // ─────────────────────────────────────────────────────────────
    // Q1: Exponents a^b · b^c
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q1-exponents-abc',
      section: 'quant',
      tags: ['exponents', 'algebra'],
      generate: function(rng) {
        // Parameters: b = k*a, c = 2*b = 2k*a
        // Fixed structure: k=2 gives classic problem
        const k = 2; // Keep fixed for GMAT authenticity

        // a^b · b^c = a^(ka) · (ka)^(2ka)
        // = a^(ka) · k^(2ka) · a^(2ka)
        // = k^(2ka) · a^(3ka)
        // = (k^(2k) · a^(3k))^a
        // For k=2: = (4 · a^6)^a = (16a^6)^a? Let me recalculate
        // Actually: k^(2k) = 2^4 = 16, 3k = 6
        // So answer is (16a^6)^a

        return {
          contextSteps: [
            {
              prompt: `Step 1: Translate the relationships. If b = ${k}a and c = 2b, what is c in terms of a?`,
              choices: [`c = ${k}a`, `c = ${k+1}a`, `c = ${2*k}a`, `c = ${3*k}a`],
              correctIndex: 2,
              correctValue: `c = ${2*k}a`
            },
            {
              prompt: `Step 2: Rewrite b^c using a. If b = ${k}a and c = ${2*k}a, which is b^c?`,
              choices: [`(${k}a)^(${k}a)`, `(${k}a)^(${2*k}a)`, `${k}^(${2*k}a) · a^(${k}a)`, `${k}^(${k}a) · a^(${2*k}a)`],
              correctIndex: 1,
              correctValue: `(${k}a)^(${2*k}a)`
            },
            {
              prompt: `Step 3: Combine the powers. a^b · b^c = a^(${k}a) · (${k}a)^(${2*k}a) simplifies to which single power?`,
              choices: [`(${k}a^4)^a`, `(${k}a^6)^a`, `(${Math.pow(k, 2*k)}a^6)^a`, `(${Math.pow(k, 2*k)}a^8)^a`],
              correctIndex: 2,
              correctValue: `(${Math.pow(k, 2*k)}a^6)^a`
            }
          ],
          finalQuestion: `If a > 0, b = ${k}a, and c = 2b, which of the following is equivalent to a^b · b^c?`,
          finalChoices: [`(${k}a^4)^a`, `(${k}a^6)^a`, `(${k}a^8)^a`, `(${Math.pow(k, 2*k)}a^6)^a`, `(${Math.pow(k, 2*k)}a^8)^a`],
          finalAnswerIndex: 3,
          finalAnswer: `(${Math.pow(k, 2*k)}a^6)^a`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q2: Bonus Optimization
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q2-bonus-optimization',
      section: 'quant',
      tags: ['optimization', 'word-problems'],
      generate: function(rng) {
        // Classic values for GMAT authenticity
        const small = 750;
        const medium = 1500;
        const large = 7350;
        const total = 64800;

        // Working: 1×750 + 1×1500 = 2250, remaining = 62550
        // 62550 / 7350 = 8.5, so 8 large bonuses = 58800
        // Remaining: 62550 - 58800 = 3750
        // 3750 = 2×1500 + 1×750 + already have 1 each = need 2 more 1500, 1 more 750
        // Total: 1+1 (required) + 8 + 2 + 1 = 13

        const remaining1 = total - small - medium; // 62550
        const numLarge = Math.floor(remaining1 / large); // 8
        const afterLarge = remaining1 - numLarge * large; // 3750
        // afterLarge = 3750 = 2*1500 + 1*750, so need 2 more medium, 1 more small
        const totalBonuses = 1 + 1 + numLarge + 2 + 1; // 13

        return {
          contextSteps: [
            {
              prompt: `Step 1: To use the fewest bonuses, which bonus amount should we use as many times as possible?`,
              choices: [`$${small.toLocaleString()}`, `$${medium.toLocaleString()}`, `$${large.toLocaleString()}`, `Use equal amounts of all three`],
              correctIndex: 2,
              correctValue: `$${large.toLocaleString()}`
            },
            {
              prompt: `Step 2: We must use each amount at least once. Start with 1 of $${small.toLocaleString()} and 1 of $${medium.toLocaleString()}. How much is left from $${total.toLocaleString()}?`,
              choices: [`$${remaining1.toLocaleString()}`, `$${(remaining1+150).toLocaleString()}`, `$${(remaining1+750).toLocaleString()}`, `$${(remaining1+1500).toLocaleString()}`],
              correctIndex: 0,
              correctValue: `$${remaining1.toLocaleString()}`
            },
            {
              prompt: `Step 3: Now pack in as many $${large.toLocaleString()} bonuses as possible. What is the largest number that does not exceed the remaining total?`,
              choices: [`${numLarge-1}`, `${numLarge}`, `${numLarge+1}`, `${numLarge+2}`],
              correctIndex: 1,
              correctValue: `${numLarge}`
            },
            {
              prompt: `Step 4: After using ${numLarge} bonuses of $${large.toLocaleString()}, the leftover must be made using $${small.toLocaleString()} and $${medium.toLocaleString()}. What pair (y,z) works, where y = # of $${medium.toLocaleString()} and z = # of $${small.toLocaleString()}, both at least 1?`,
              choices: [`y=1, z=1`, `y=2, z=2`, `y=3, z=2`, `y=4, z=1`],
              correctIndex: 2,
              correctValue: `y=3, z=2`
            }
          ],
          finalQuestion: `Last year a company gave bonuses to a number of employees, but only in the three amounts of $${small.toLocaleString()}, $${medium.toLocaleString()}, and $${large.toLocaleString()}. If the total amount of the bonuses was $${total.toLocaleString()} and each of the three amounts was given to at least one employee, what is the fewest number of bonuses that the company could have given to employees last year?`,
          finalChoices: [`10`, `11`, `12`, `13`, `14`],
          finalAnswerIndex: 3,
          finalAnswer: `13`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q3: Factorial Powers of 2
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q3-factorial-powers',
      section: 'quant',
      tags: ['factorials', 'exponents'],
      generate: function(rng) {
        // (√8! + √9!)² = (√8! + 3√8!)² = (4√8!)² = 16·8!
        // v₂(8!) = 4 + 2 + 1 = 7
        // v₂(16) = 4
        // Total = 11

        const n = 8;
        const nPlus1 = 9;
        const sqrtFactor = Math.sqrt(nPlus1); // 3
        const combinedCoeff = 1 + sqrtFactor; // 4
        const squaredCoeff = combinedCoeff * combinedCoeff; // 16
        const v2_factorial = Math.floor(n/2) + Math.floor(n/4) + Math.floor(n/8); // 7
        const v2_coeff = Math.log2(squaredCoeff); // 4
        const totalPower = v2_factorial + v2_coeff; // 11

        return {
          contextSteps: [
            {
              prompt: `Step 1: Factor out the common term. √(${nPlus1}!) can be rewritten as √(${nPlus1}·${n}!). Which is correct?`,
              choices: [`√(${nPlus1}!) = ${nPlus1}·√(${n}!)`, `√(${nPlus1}!) = ${sqrtFactor}·√(${n}!)`, `√(${nPlus1}!) = √${nPlus1} + √(${n}!)`, `√(${nPlus1}!) = √(${n}!)/${sqrtFactor}`],
              correctIndex: 1,
              correctValue: `√(${nPlus1}!) = ${sqrtFactor}·√(${n}!)`
            },
            {
              prompt: `Step 2: Simplify the sum. √(${n}!) + √(${nPlus1}!) becomes which expression?`,
              choices: [`√(${n}!)(1+${sqrtFactor})`, `√(${n}!)(1+${nPlus1})`, `√(${n}!)(${sqrtFactor}-1)`, `√(${n}!)(${nPlus1}-1)`],
              correctIndex: 0,
              correctValue: `√(${n}!)(1+${sqrtFactor})`
            },
            {
              prompt: `Step 3: Square it. [${combinedCoeff}√(${n}!)]² equals:`,
              choices: [`${n}!`, `${combinedCoeff}·${n}!`, `${squaredCoeff}·${n}!`, `${squaredCoeff*2}·${n}!`],
              correctIndex: 2,
              correctValue: `${squaredCoeff}·${n}!`
            },
            {
              prompt: `Step 4: Count factors of 2. The power of 2 in ${n}! is v₂(${n}!) = floor(${n}/2)+floor(${n}/4)+floor(${n}/8) =`,
              choices: [`${v2_factorial-1}`, `${v2_factorial}`, `${v2_factorial+1}`, `${v2_factorial+2}`],
              correctIndex: 1,
              correctValue: `${v2_factorial}`
            },
            {
              prompt: `Step 5: Multiply by ${squaredCoeff} adds how many extra factors of 2?`,
              choices: [`${v2_coeff-2}`, `${v2_coeff-1}`, `${v2_coeff}`, `${v2_coeff+1}`],
              correctIndex: 2,
              correctValue: `${v2_coeff}`
            }
          ],
          finalQuestion: `The value of (√(${n}!) + √(${nPlus1}!))² is an integer. What is the greatest integer n such that 2^n is a factor of (√(${n}!) + √(${nPlus1}!))²?`,
          finalChoices: [`3`, `6`, `8`, `${totalPower}`, `14`],
          finalAnswerIndex: 3,
          finalAnswer: `${totalPower}`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q4: Divisibility k^4 by 32
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q4-divisibility-remainder',
      section: 'quant',
      tags: ['divisibility', 'number-theory'],
      generate: function(rng) {
        // 32 = 2^5, so k^4 needs at least 5 factors of 2
        // If k has m factors of 2, k^4 has 4m factors
        // Need 4m ≥ 5, so m ≥ 2 (k divisible by 4)
        // Check: 2 has 1 factor → k^4 has 4 < 5 ✗
        // 4 has 2 factors → k^4 has 8 ≥ 5 ✓
        // 6 has 1 factor → k^4 has 4 < 5 ✗

        return {
          contextSteps: [
            {
              prompt: `Step 1: Rewrite 32 as a power of 2.`,
              choices: [`32 = 2^4`, `32 = 2^5`, `32 = 2^6`, `32 = 2^8`],
              correctIndex: 1,
              correctValue: `32 = 2^5`
            },
            {
              prompt: `Step 2: If k has exactly one factor of 2 (k is even but not divisible by 4), how many factors of 2 does k^4 have?`,
              choices: [`1`, `2`, `4`, `8`],
              correctIndex: 2,
              correctValue: `4`
            },
            {
              prompt: `Step 3: To make k^4 divisible by 32 (=2^5), what must be true about k?`,
              choices: [`k must be odd`, `k must be divisible by 2`, `k must be divisible by 4`, `k must be divisible by 8`],
              correctIndex: 2,
              correctValue: `k must be divisible by 4`
            },
            {
              prompt: `Step 4: If k is divisible by 4, then k mod 32 must be a multiple of:`,
              choices: [`2`, `3`, `4`, `5`],
              correctIndex: 2,
              correctValue: `4`
            }
          ],
          finalQuestion: `When the integer k^4 is divided by 32, the remainder is 0. Which of the following could be the remainder when the integer k is divided by 32?\nI. 2\nII. 4\nIII. 6`,
          finalChoices: [`None`, `I only`, `II only`, `I and II`, `II and III`],
          finalAnswerIndex: 2,
          finalAnswer: `II only`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q5: Nested Radicals
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q5-nested-radicals',
      section: 'quant',
      tags: ['radicals', 'algebra'],
      generate: function(rng) {
        // (√(15-4√14) + √(15+4√14))²
        // Let A = √(15-4√14), B = √(15+4√14)
        // A² + B² = 30 (cancel √14 terms)
        // AB = √((15-4√14)(15+4√14)) = √(225-224) = √1 = 1
        // (A+B)² = A² + B² + 2AB = 30 + 2 = 32

        const innerSum = 15;
        const innerCoeff = 4;
        const radical = 14;
        const sumSquares = 2 * innerSum; // 30
        const product = Math.sqrt(innerSum * innerSum - innerCoeff * innerCoeff * radical); // √1 = 1
        const answer = sumSquares + 2 * product; // 32

        return {
          contextSteps: [
            {
              prompt: `Step 1: Let A = √(${innerSum} − ${innerCoeff}√${radical}) and B = √(${innerSum} + ${innerCoeff}√${radical}). What is (A + B)² in terms of A², B², and AB?`,
              choices: [`A² + B²`, `A² + B² + 2AB`, `A² + B² − 2AB`, `(A²)(B²)`],
              correctIndex: 1,
              correctValue: `A² + B² + 2AB`
            },
            {
              prompt: `Step 2: Compute A² + B².`,
              choices: [`0`, `${innerSum}`, `${sumSquares}`, `${sumSquares * 2}`],
              correctIndex: 2,
              correctValue: `${sumSquares}`
            },
            {
              prompt: `Step 3: Compute AB = √[(${innerSum} − ${innerCoeff}√${radical})(${innerSum} + ${innerCoeff}√${radical})]. This equals √(${innerSum}² − (${innerCoeff}√${radical})²) = √(?)`,
              choices: [`√0`, `√1`, `√2`, `√${radical}`],
              correctIndex: 1,
              correctValue: `√1`
            },
            {
              prompt: `Step 4: Put it together: (A+B)² = ${sumSquares} + 2·AB = ${sumSquares} + 2·${product} =`,
              choices: [`${sumSquares}`, `${sumSquares + 1}`, `${answer}`, `${answer + 1}`],
              correctIndex: 2,
              correctValue: `${answer}`
            }
          ],
          finalQuestion: `( √(${innerSum} − ${innerCoeff}√${radical}) + √(${innerSum} + ${innerCoeff}√${radical}) )² =`,
          finalChoices: [`28`, `30`, `32`, `34`, `36`],
          finalAnswerIndex: 2,
          finalAnswer: `32`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q6: Integer Equation (x-y)² + 2y² = 27
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q6-integer-equation',
      section: 'quant',
      tags: ['algebra', 'integers'],
      generate: function(rng) {
        // (x-y)² + 2y² = 27
        // For y = -1: (x+1)² + 2 = 27 → (x+1)² = 25 → x = 4 or -6
        // Answer: x = 4

        const total = 27;
        const yVal = -1;
        const squareResult = total - 2 * yVal * yVal; // 25
        const sqrtResult = Math.sqrt(squareResult); // 5
        const xVal1 = sqrtResult - 1 - yVal; // 4
        const xVal2 = -sqrtResult - 1 - yVal; // -6

        return {
          contextSteps: [
            {
              prompt: `Step 1: Since x and y are integers, (x − y)² is always:`,
              choices: [`Odd`, `Even`, `A nonnegative perfect square`, `Always prime`],
              correctIndex: 2,
              correctValue: `A nonnegative perfect square`
            },
            {
              prompt: `Step 2: From (x − y)² + 2y² = ${total}, what inequality must be true so (x − y)² is not negative?`,
              choices: [`2y² ≥ ${total}`, `2y² ≤ ${total}`, `y² ≥ ${total}`, `y² ≤ ${total}/4`],
              correctIndex: 1,
              correctValue: `2y² ≤ ${total}`
            },
            {
              prompt: `Step 3: Try y = ${yVal}. Then (x − (${yVal}))² + 2(${yVal})² = ${total} becomes (x+1)² + 2 = ${total}, so (x+1)² =`,
              choices: [`${squareResult - 2}`, `${squareResult - 1}`, `${squareResult}`, `${squareResult + 1}`],
              correctIndex: 2,
              correctValue: `${squareResult}`
            },
            {
              prompt: `Step 4: If (x+1)² = ${squareResult}, then x could be:`,
              choices: [`${xVal2} or ${xVal1}`, `${-sqrtResult} or ${sqrtResult}`, `${xVal2 + 2} or ${xVal1 + 2}`, `${xVal2 + 3} or ${xVal1 + 3}`],
              correctIndex: 0,
              correctValue: `${xVal2} or ${xVal1}`
            }
          ],
          finalQuestion: `If x and y are integers and if (x − y)² + 2y² = ${total}, which of the following could be the value of x?`,
          finalChoices: [`−2`, `−1`, `3`, `4`, `5`],
          finalAnswerIndex: 3,
          finalAnswer: `4`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q7: x + √x = 1
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q7-sqrt-substitution',
      section: 'quant',
      tags: ['algebra', 'quadratics'],
      generate: function(rng) {
        // Let t = √x, then t² + t = 1, t² + t - 1 = 0
        // t = (-1 + √5)/2 (positive root)
        // = (√5 - 1)/2

        return {
          contextSteps: [
            {
              prompt: `Step 1: Let t = √x. Then x =`,
              choices: [`t`, `t²`, `2t`, `1/t`],
              correctIndex: 1,
              correctValue: `t²`
            },
            {
              prompt: `Step 2: Substitute into x + √x = 1. You get:`,
              choices: [`t² + t = 1`, `t² − t = 1`, `t + 1 = t²`, `t² + 1 = t`],
              correctIndex: 0,
              correctValue: `t² + t = 1`
            },
            {
              prompt: `Step 3: Solve t² + t − 1 = 0. The positive root is:`,
              choices: [`(−1 − √5)/2`, `(−1 + √5)/2`, `(1 − √5)/2`, `(1 + √5)/2`],
              correctIndex: 1,
              correctValue: `(−1 + √5)/2`
            }
          ],
          finalQuestion: `If x is a real number and x + √x = 1, which of the following is the value of √x?`,
          finalChoices: [`(1/2)(√5 − 1)`, `(1/2)(√5 + 1)`, `(1/2)(√5 − 3)`, `(1/2)(√5 + 3)`, `(1/2)(3 − √5)`],
          finalAnswerIndex: 0,
          finalAnswer: `(1/2)(√5 − 1)`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q8: Simplify Fraction
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q8-fraction-simplify',
      section: 'quant',
      tags: ['fractions', 'GCF'],
      generate: function(rng) {
        // Parameterize: pick GCF and co-prime nums
        const gcfVal = pickFrom(rng, [2, 3, 5]);
        const simpleNum = pickFrom(rng, [2, 3]);
        let simpleDen = pickFrom(rng, [3, 5, 7]);
        while (simpleDen === simpleNum) simpleDen = pickFrom(rng, [4, 5, 7]);

        const num = simpleNum * gcfVal;
        const den = simpleDen * gcfVal;

        return {
          contextSteps: [
            {
              prompt: `Step 1: To simplify a fraction, you divide numerator and denominator by their:`,
              choices: [`Sum`, `Difference`, `Greatest common factor (GCF)`, `Least common multiple (LCM)`],
              correctIndex: 2,
              correctValue: `Greatest common factor (GCF)`
            },
            {
              prompt: `Step 2: The GCF of ${num} and ${den} is:`,
              choices: [`1`, `${gcfVal - 1}`, `${gcfVal}`, `${num}`],
              correctIndex: 2,
              correctValue: `${gcfVal}`
            },
            {
              prompt: `Step 3: ${num}/${den} simplified equals:`,
              choices: [`${simpleNum}/${simpleDen}`, `${simpleDen}/${simpleNum}`, `${gcfVal}/${simpleNum}`, `1/${simpleDen}`],
              correctIndex: 0,
              correctValue: `${simpleNum}/${simpleDen}`
            }
          ],
          finalQuestion: `What is the simplified form of ${num}/${den}?`,
          finalChoices: [`${simpleNum}/${simpleDen}`, `${simpleDen}/${simpleNum}`, `${simpleNum}/${simpleDen + 3}`, `${simpleNum + 1}/${simpleDen}`, `${simpleDen}/${simpleNum + 1}`],
          finalAnswerIndex: 0,
          finalAnswer: `${simpleNum}/${simpleDen}`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q9: Trust Fund Fractions
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q9-trust-fund',
      section: 'quant',
      tags: ['fractions', 'word-problems'],
      generate: function(rng) {
        // 1/2 + 1/4 + 1/5 = 10/20 + 5/20 + 4/20 = 19/20
        // Remaining = 1/20 = $10,000
        // Total = $200,000

        const remainder = 10000;
        const remainderFraction = 20; // 1/20
        const total = remainder * remainderFraction;
        const investedFraction = '19/20';

        return {
          contextSteps: [
            {
              prompt: `Step 1: Add the invested fractions: 1/2 + 1/4 + 1/5 =`,
              choices: [`(19/20)`, `(9/10)`, `(17/20)`, `(3/4)`],
              correctIndex: 0,
              correctValue: `(19/20)`
            },
            {
              prompt: `Step 2: If ${investedFraction} is invested, the remaining fraction is:`,
              choices: [`1/${remainderFraction}`, `1/19`, `1/10`, `1/5`],
              correctIndex: 0,
              correctValue: `1/${remainderFraction}`
            },
            {
              prompt: `Step 3: If the remaining 1/${remainderFraction} equals $${remainder.toLocaleString()}, then the total is ${remainderFraction} times that, which is:`,
              choices: [`$100,000`, `$150,000`, `$${total.toLocaleString()}`, `$500,000`],
              correctIndex: 2,
              correctValue: `$${total.toLocaleString()}`
            }
          ],
          finalQuestion: `If 1/2 of the money in a certain trust fund was invested in stocks, 1/4 in bonds, 1/5 in a mutual fund, and the remaining $${remainder.toLocaleString()} in a government certificate, what was the total amount of the trust fund?`,
          finalChoices: [`$100,000`, `$150,000`, `$200,000`, `$500,000`, `$2,000,000`],
          finalAnswerIndex: 2,
          finalAnswer: `$200,000`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q10: Mixture Problem
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q10-mixture-problem',
      section: 'quant',
      tags: ['mixtures', 'algebra'],
      generate: function(rng) {
        // Total = 300g, X = 10%, Y = 15%, protein = 38g
        // 0.10x + 0.15(300-x) = 38
        // 0.10x + 45 - 0.15x = 38
        // -0.05x = -7
        // x = 140

        const totalMix = 300;
        const pctX = 10;
        const pctY = 15;
        const proteinTotal = 38;
        const proteinFromYAtFull = (pctY / 100) * totalMix; // 45
        const diff = proteinFromYAtFull - proteinTotal; // 7
        const xAmount = diff / ((pctY - pctX) / 100); // 140

        return {
          contextSteps: [
            {
              prompt: `Step 1: Let x be grams of food X. Then grams of food Y equals:`,
              choices: [`${totalMix} + x`, `${totalMix} − x`, `x/${totalMix}`, `${totalMix}x`],
              correctIndex: 1,
              correctValue: `${totalMix} − x`
            },
            {
              prompt: `Step 2: Protein equation: ${pctX}% of X + ${pctY}% of Y = ${proteinTotal} becomes:`,
              choices: [`0.${pctX}x + 0.${pctY}(${totalMix} − x) = ${proteinTotal}`, `0.${pctX}x + 0.${pctY}x = ${proteinTotal}`, `0.${pctX}(${totalMix} − x) + 0.${pctY}x = ${proteinTotal}`, `0.${pctX}x + 0.${pctY}(${totalMix} + x) = ${proteinTotal}`],
              correctIndex: 0,
              correctValue: `0.${pctX}x + 0.${pctY}(${totalMix} − x) = ${proteinTotal}`
            },
            {
              prompt: `Step 3: Simplify: 0.${pctX}x + ${proteinFromYAtFull} − 0.${pctY}x = ${proteinTotal} becomes:`,
              choices: [`${proteinFromYAtFull} + 0.05x = ${proteinTotal}`, `${proteinFromYAtFull} − 0.05x = ${proteinTotal}`, `${proteinFromYAtFull} − 0.10x = ${proteinTotal}`, `${proteinFromYAtFull} + 0.10x = ${proteinTotal}`],
              correctIndex: 1,
              correctValue: `${proteinFromYAtFull} − 0.05x = ${proteinTotal}`
            },
            {
              prompt: `Step 4: Solve ${proteinFromYAtFull} − 0.05x = ${proteinTotal}. Then 0.05x equals:`,
              choices: [`5`, `6`, `${diff}`, `8`],
              correctIndex: 2,
              correctValue: `${diff}`
            }
          ],
          finalQuestion: `A rabbit on a controlled diet is fed daily ${totalMix} grams of a mixture of two foods, food X and food Y. Food X contains ${pctX} percent protein and food Y contains ${pctY} percent protein. If the rabbit's diet provides exactly ${proteinTotal} grams of protein daily, how many grams of food X are in the mixture?`,
          finalChoices: [`100`, `${xAmount}`, `150`, `160`, `200`],
          finalAnswerIndex: 1,
          finalAnswer: `${xAmount}`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q11: Speed Conversion
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q11-speed-conversion',
      section: 'quant',
      tags: ['rates', 'unit-conversion'],
      generate: function(rng) {
        // 1 min 48 sec = 108 sec = 0.03 hr
        // 2400 m = 2.4 km
        // Speed = 2.4 / 0.03 = 80 km/hr

        const minutes = 1;
        const seconds = 48;
        const totalSeconds = minutes * 60 + seconds; // 108
        const totalHours = totalSeconds / 3600; // 0.03
        const distanceMeters = 2400;
        const distanceKm = distanceMeters / 1000; // 2.4
        const speed = distanceKm / totalHours; // 80

        return {
          contextSteps: [
            {
              prompt: `Step 1: Convert time. ${minutes} minute ${seconds} seconds equals how many seconds total?`,
              choices: [`${totalSeconds - 20}`, `${totalSeconds - 10}`, `${totalSeconds}`, `${totalSeconds + 10}`],
              correctIndex: 2,
              correctValue: `${totalSeconds}`
            },
            {
              prompt: `Step 2: Convert ${totalSeconds} seconds to hours: ${totalSeconds}/3600 =`,
              choices: [`0.01 hr`, `0.02 hr`, `${totalHours} hr`, `0.04 hr`],
              correctIndex: 2,
              correctValue: `${totalHours} hr`
            },
            {
              prompt: `Step 3: Convert ${distanceMeters.toLocaleString()} meters to kilometers:`,
              choices: [`0.24 km`, `${distanceKm} km`, `24 km`, `240 km`],
              correctIndex: 1,
              correctValue: `${distanceKm} km`
            },
            {
              prompt: `Step 4: Speed = distance / time = ${distanceKm} / ${totalHours} =`,
              choices: [`60`, `70`, `${speed}`, `90`],
              correctIndex: 2,
              correctValue: `${speed}`
            }
          ],
          finalQuestion: `A car traveling at a constant speed took ${minutes} minute ${seconds} seconds to travel the distance between a certain road sign and the beginning of a roadwork area. If the distance between the road sign and the beginning of the roadwork area was ${distanceMeters.toLocaleString()} meters, then the car was traveling at what speed, in kilometers per hour? (1 kilometer = 1,000 meters)`,
          finalChoices: [`50`, `60`, `80`, `90`, `100`],
          finalAnswerIndex: 2,
          finalAnswer: `80`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q12: Average Salary
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q12-average-salary',
      section: 'quant',
      tags: ['averages', 'statistics'],
      generate: function(rng) {
        // 2×$14,000 + 1×$16,000 + 3×$17,000 = $95,000
        // Average = $95,000 / 6 ≈ $15,833 → closest to $15,800

        const n1 = 2, s1 = 14000;
        const n2 = 1, s2 = 16000;
        const n3 = 3, s3 = 17000;
        const total = n1 * s1 + n2 * s2 + n3 * s3; // 95000
        const count = n1 + n2 + n3; // 6
        const avg = total / count; // 15833.33
        const roundedAvg = Math.round(avg / 100) * 100; // 15800

        return {
          contextSteps: [
            {
              prompt: `Step 1: Total salary = ${n1}($${s1.toLocaleString()}) + ${n2}($${s2.toLocaleString()}) + ${n3}($${s3.toLocaleString()}) equals:`,
              choices: [`$92,000`, `$94,000`, `$${total.toLocaleString()}`, `$97,000`],
              correctIndex: 2,
              correctValue: `$${total.toLocaleString()}`
            },
            {
              prompt: `Step 2: Average salary = total / ${count} = $${total.toLocaleString()} / ${count} ≈`,
              choices: [`$15,200`, `$15,500`, `$${Math.round(avg).toLocaleString()}`, `$16,400`],
              correctIndex: 2,
              correctValue: `$${Math.round(avg).toLocaleString()}`
            },
            {
              prompt: `Step 3: $${Math.round(avg).toLocaleString()} is closest to:`,
              choices: [`$15,200`, `$15,500`, `$${roundedAvg.toLocaleString()}`, `$16,400`],
              correctIndex: 2,
              correctValue: `$${roundedAvg.toLocaleString()}`
            }
          ],
          finalQuestion: `A certain bakery has ${count} employees. It pays annual salaries of $${s1.toLocaleString()} to each of ${n1} employees, $${s2.toLocaleString()} to ${n2} employee, and $${s3.toLocaleString()} to each of the remaining ${n3} employees. The average (arithmetic mean) annual salary of these employees is closest to which of the following?`,
          finalChoices: [`$15,200`, `$15,500`, `$15,800`, `$16,000`, `$16,400`],
          finalAnswerIndex: 2,
          finalAnswer: `$15,800`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q13: Company Employees
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q13-company-employees',
      section: 'quant',
      tags: ['algebra', 'systems'],
      generate: function(rng) {
        // X has 50, Y has 60
        // Same full-time: X_ft = Y_ft
        // Let p = X part-time, X_ft = 50 - p
        // Y_ft = 50 - p, Y_pt = 60 - (50-p) = 10 + p
        // Y_pt = 2(X_pt) + 3 → 10 + p = 2p + 3 → p = 7
        // Y_pt = 10 + 7 = 17

        const xTotal = 50;
        const yTotal = 60;
        const diff = yTotal - xTotal; // 10
        // 10 + p = 2p + 3 → p = 7
        const xPartTime = 7;
        const yPartTime = diff + xPartTime; // 17

        return {
          contextSteps: [
            {
              prompt: `Step 1: Let Company X have p part-time employees. Then Company X has how many full-time employees?`,
              choices: [`${xTotal} + p`, `${xTotal} − p`, `p − ${xTotal}`, `${xTotal}p`],
              correctIndex: 1,
              correctValue: `${xTotal} − p`
            },
            {
              prompt: `Step 2: Company Y has ${yTotal} employees and the same number of full-time employees as X. So Company Y has how many part-time employees?`,
              choices: [`${diff} + p`, `${diff} − p`, `${yTotal} − p`, `${xTotal} + p`],
              correctIndex: 0,
              correctValue: `${diff} + p`
            },
            {
              prompt: `Step 3: The condition says: Y part-time = 2(X part-time) + 3. That equation is:`,
              choices: [`${diff} + p = 2p + 3`, `${diff} + p = 2p − 3`, `${diff} − p = 2p + 3`, `${yTotal} − p = 2p + 3`],
              correctIndex: 0,
              correctValue: `${diff} + p = 2p + 3`
            },
            {
              prompt: `Step 4: Solve ${diff} + p = 2p + 3. Then p =`,
              choices: [`5`, `6`, `${xPartTime}`, `8`],
              correctIndex: 2,
              correctValue: `${xPartTime}`
            },
            {
              prompt: `Step 5: Then Company Y part-time = ${diff} + p =`,
              choices: [`15`, `16`, `${yPartTime}`, `18`],
              correctIndex: 2,
              correctValue: `${yPartTime}`
            }
          ],
          finalQuestion: `Company X has ${xTotal} employees and Company Y has ${yTotal} employees. Both companies have the same number of full-time employees, but Company Y has 3 more than twice the number of part-time employees that Company X has. How many part-time employees does Company Y have?`,
          finalChoices: [`3`, `7`, `14`, `17`, `20`],
          finalAnswerIndex: 3,
          finalAnswer: `17`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q14: Units Digit
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q14-units-digit',
      section: 'quant',
      tags: ['number-theory', 'patterns'],
      generate: function(rng) {
        // a² ends in 9 → a ends in 3 or 7
        // (a+1)² ends in 4 → a+1 ends in 2 or 8
        // If a ends in 3: a+1 ends in 4, 4²=16 ends in 6 ✗
        // If a ends in 7: a+1 ends in 8, 8²=64 ends in 4 ✓
        // So a ends in 7, a+2 ends in 9, 9²=81 ends in 1

        return {
          contextSteps: [
            {
              prompt: `Step 1: If a² ends in 9, then a must end in:`,
              choices: [`1 or 9`, `3 or 7`, `2 or 8`, `4 or 6`],
              correctIndex: 1,
              correctValue: `3 or 7`
            },
            {
              prompt: `Step 2: Test a ending in 3. Then (a+1) ends in 4, so (a+1)² ends in:`,
              choices: [`4`, `6`, `8`, `0`],
              correctIndex: 1,
              correctValue: `6`
            },
            {
              prompt: `Step 3: Since (a+1)² must end in 4, a cannot end in 3, so a must end in:`,
              choices: [`1`, `5`, `7`, `9`],
              correctIndex: 2,
              correctValue: `7`
            },
            {
              prompt: `Step 4: If a ends in 7, then a+2 ends in 9, so (a+2)² ends in:`,
              choices: [`1`, `3`, `5`, `9`],
              correctIndex: 0,
              correctValue: `1`
            }
          ],
          finalQuestion: `If a is a positive integer, and if the units digit of a² is 9 and the units digit of (a + 1)² is 4, what is the units digit of (a + 2)²?`,
          finalChoices: [`1`, `3`, `5`, `6`, `14`],
          finalAnswerIndex: 0,
          finalAnswer: `1`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q15: Exponent System
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q15-exponent-system',
      section: 'quant',
      tags: ['exponents', 'systems'],
      generate: function(rng) {
        // (2^x)(2^y) = 8 → x+y = 3
        // (9^x)(3^y) = 81 → 2x+y = 4
        // x = 1, y = 2

        const sum = 3;
        const secondSum = 4;
        const x = secondSum - sum; // 1
        const y = sum - x; // 2

        return {
          contextSteps: [
            {
              prompt: `Step 1: (2^x)(2^y) = 8 can be combined as 2^(x+y) = 8 = 2³, so:`,
              choices: [`x + y = 2`, `x + y = ${sum}`, `x + y = 4`, `x + y = 8`],
              correctIndex: 1,
              correctValue: `x + y = ${sum}`
            },
            {
              prompt: `Step 2: (9^x)(3^y) = 81. Rewrite 9^x as (3²)^x = 3^(2x). Then the left side becomes 3^(2x+y). Since 81 = 3⁴, we get:`,
              choices: [`2x + y = 3`, `2x + y = ${secondSum}`, `2x + y = 5`, `2x + y = 6`],
              correctIndex: 1,
              correctValue: `2x + y = ${secondSum}`
            },
            {
              prompt: `Step 3: Solve the system: x+y=${sum} and 2x+y=${secondSum}. Subtract the first from the second to get x =`,
              choices: [`0`, `${x}`, `2`, `3`],
              correctIndex: 1,
              correctValue: `${x}`
            },
            {
              prompt: `Step 4: If x=${x} and x+y=${sum}, then y=`,
              choices: [`1`, `${y}`, `3`, `4`],
              correctIndex: 1,
              correctValue: `${y}`
            }
          ],
          finalQuestion: `If (2^x)(2^y) = 8 and (9^x)(3^y) = 81, then (x, y) =`,
          finalChoices: [`(1, 2)`, `(2, 1)`, `(1, 1)`, `(2, 2)`, `(1, 3)`],
          finalAnswerIndex: 0,
          finalAnswer: `(1, 2)`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q16: Ratio Expression
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q16-ratio-expression',
      section: 'quant',
      tags: ['ratios', 'algebra'],
      generate: function(rng) {
        // x/y = 2/3 → x=2k, y=3k
        // (x-y)/x = (2k-3k)/(2k) = -k/(2k) = -1/2

        const xRatio = 2;
        const yRatio = 3;
        const result = `−1/2`; // (xRatio - yRatio) / xRatio simplified

        return {
          contextSteps: [
            {
              prompt: `Step 1: If x/y = ${xRatio}/${yRatio}, we can represent x and y as:`,
              choices: [`x=${xRatio}k, y=${yRatio}k`, `x=${yRatio}k, y=${xRatio}k`, `x=${xRatio}k, y=k`, `x=k, y=${yRatio}k`],
              correctIndex: 0,
              correctValue: `x=${xRatio}k, y=${yRatio}k`
            },
            {
              prompt: `Step 2: Compute (x−y)/x using x=${xRatio}k and y=${yRatio}k:`,
              choices: [`(${xRatio}k−${yRatio}k)/(${xRatio}k) = ${result}`, `(${xRatio}k−${yRatio}k)/(${yRatio}k) = −1/3`, `(${yRatio}k−${xRatio}k)/(${xRatio}k) = 1/2`, `(${yRatio}k−${xRatio}k)/(${yRatio}k) = 1/3`],
              correctIndex: 0,
              correctValue: `(${xRatio}k−${yRatio}k)/(${xRatio}k) = ${result}`
            }
          ],
          finalQuestion: `If x/y = ${xRatio}/${yRatio}, then (x − y)/x =`,
          finalChoices: [`−1/2`, `−1/3`, `1/3`, `1/2`, `5/2`],
          finalAnswerIndex: 0,
          finalAnswer: `−1/2`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q17: Parabola Minimum
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q17-parabola-minimum',
      section: 'quant',
      tags: ['quadratics', 'optimization'],
      generate: function(rng) {
        // y = k + (x - h)² is minimized when x = h
        const h = pickFrom(rng, [2, 3, 4, 5]);
        const k = pickFrom(rng, [2, 3, 4, 5, 6]);

        return {
          contextSteps: [
            {
              prompt: `Step 1: y = ${k} + (x − ${h})² is a parabola. The square (x − ${h})² is smallest when x equals:`,
              choices: [`0`, `${h}`, `${k}`, `−${h}`],
              correctIndex: 1,
              correctValue: `${h}`
            },
            {
              prompt: `Step 2: The smallest possible value of (x − ${h})² is:`,
              choices: [`−1`, `0`, `1`, `${h}`],
              correctIndex: 1,
              correctValue: `0`
            },
            {
              prompt: `Step 3: So y is minimized when x = ${h} (because then y = ${k} + 0). Therefore, the minimizing x is:`,
              choices: [`${k + h + 10}`, `${k + h + 9}`, `0`, `${h}`],
              correctIndex: 3,
              correctValue: `${h}`
            }
          ],
          finalQuestion: `If y = ${k} + (x − ${h})², then y is least when x =`,
          finalChoices: [`${k + h + 10}`, `${k + h + 9}`, `0`, `${h}`, `${k}`],
          finalAnswerIndex: 3,
          finalAnswer: `${h}`
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // Q18: Continued Fraction
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q18-continued-fraction',
      section: 'quant',
      tags: ['fractions', 'order-of-operations'],
      generate: function(rng) {
        // 1/(1 + 1/(2 + 1/3))
        // Inner: 2 + 1/3 = 7/3
        // 1/(7/3) = 3/7
        // 1 + 3/7 = 10/7
        // 1/(10/7) = 7/10

        const innerDen = 3;
        const middleWhole = 2;
        const innerResult = middleWhole + 1/innerDen; // 7/3
        const innerResultNum = middleWhole * innerDen + 1; // 7
        const innerResultDen = innerDen; // 3
        const reciprocal1 = `${innerResultDen}/${innerResultNum}`; // 3/7
        const outerSum = `${innerResultNum + innerResultDen}/${innerResultNum}`; // 10/7
        const finalNum = innerResultNum; // 7
        const finalDen = innerResultNum + innerResultDen; // 10

        return {
          contextSteps: [
            {
              prompt: `Step 1: Start inside: ${middleWhole} + 1/${innerDen} equals:`,
              choices: [`${innerResultNum - 2}/${innerResultDen}`, `${innerResultNum - 1}/${innerResultDen}`, `${innerResultNum}/${innerResultDen}`, `${innerResultNum + 1}/${innerResultDen}`],
              correctIndex: 2,
              correctValue: `${innerResultNum}/${innerResultDen}`
            },
            {
              prompt: `Step 2: Now compute 1 / (${middleWhole} + 1/${innerDen}). Since ${middleWhole} + 1/${innerDen} = ${innerResultNum}/${innerResultDen}, the reciprocal is:`,
              choices: [`${innerResultNum}/${innerResultDen}`, `${innerResultDen}/${innerResultNum}`, `${finalNum}/${finalDen}`, `${finalDen}/${finalNum}`],
              correctIndex: 1,
              correctValue: `${innerResultDen}/${innerResultNum}`
            },
            {
              prompt: `Step 3: Now compute 1 + ${innerResultDen}/${innerResultNum} =`,
              choices: [`${finalDen}/${finalNum}`, `${finalNum}/${finalDen}`, `${innerResultDen + 1}/${innerResultNum}`, `${innerResultNum + 1}/${innerResultNum}`],
              correctIndex: 0,
              correctValue: `${finalDen}/${finalNum}`
            },
            {
              prompt: `Step 4: Finally take the reciprocal: 1 / (${finalDen}/${finalNum}) =`,
              choices: [`${finalDen}/${finalNum}`, `${finalNum}/${finalDen}`, `${innerResultDen}/${finalDen}`, `${innerResultNum - 1}/${finalNum}`],
              correctIndex: 1,
              correctValue: `${finalNum}/${finalDen}`
            }
          ],
          finalQuestion: `1 / ( 1 + 1 / ( ${middleWhole} + 1/${innerDen} ) ) =`,
          finalChoices: [`3/10`, `7/10`, `6/7`, `10/7`, `10/3`],
          finalAnswerIndex: 1,
          finalAnswer: `7/10`
        };
      }
    }
  ];

  // ═══════════════════════════════════════════════════════════════
  // QUESTION GENERATION API
  // ═══════════════════════════════════════════════════════════════

  function generateQuestion(template, seed) {
    const rng = seedRandom(seed);
    const generated = template.generate(rng);

    return {
      id: template.id,
      section: template.section,
      tags: template.tags,
      variantSeed: seed,
      contextSteps: generated.contextSteps,
      finalQuestion: generated.finalQuestion,
      finalChoices: generated.finalChoices,
      finalAnswerIndex: generated.finalAnswerIndex,
      finalAnswer: generated.finalAnswer,
      // For cheatsheet/flashcard
      cheatsheet: {
        title: template.id.replace('q', 'Question ').replace(/-/g, ' '),
        body: generated.finalQuestion,
        steps: generated.contextSteps.map(s => s.prompt),
        keyFormulas: []
      },
      flashcard: {
        front: generated.finalQuestion,
        back: `Answer: ${generated.finalAnswer}`
      }
    };
  }

  function generateQuizQuestions(baseSeed, attemptNumber, sectionFilter = 'all') {
    const questions = [];

    QUESTION_TEMPLATES.forEach((template, idx) => {
      if (sectionFilter !== 'all' && template.section !== sectionFilter) {
        return;
      }

      const seed = hashSeed(baseSeed, template.id, attemptNumber);
      questions.push(generateQuestion(template, seed));
    });

    // Shuffle
    const shuffleSeed = hashSeed(baseSeed, 'shuffle', attemptNumber);
    return shuffle(seedRandom(shuffleSeed), questions);
  }

  function validateAllTemplates(iterations = 20) {
    const results = { passed: 0, failed: 0, errors: [] };

    QUESTION_TEMPLATES.forEach(template => {
      for (let i = 0; i < iterations; i++) {
        try {
          const seed = Date.now() + i * 1000;
          const q = generateQuestion(template, seed);

          if (q.finalAnswerIndex < 0 || q.finalAnswerIndex >= q.finalChoices.length) {
            throw new Error(`Invalid finalAnswerIndex`);
          }
          if (q.finalChoices[q.finalAnswerIndex] !== q.finalAnswer) {
            throw new Error(`Answer mismatch`);
          }
          results.passed++;
        } catch (e) {
          results.failed++;
          results.errors.push(`${template.id}: ${e.message}`);
        }
      }
    });

    console.log(`Validation: ${results.passed} passed, ${results.failed} failed`);
    return results;
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════

  const QuestionTemplates = {
    QUESTION_TEMPLATES,
    generateQuestion,
    generateQuizQuestions,
    validateAllTemplates,
    seedRandom,
    hashSeed,
    shuffle,
    VERSION: '9.0'
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionTemplates;
  } else {
    global.QuestionTemplates = QuestionTemplates;
  }

})(typeof window !== 'undefined' ? window : global);
