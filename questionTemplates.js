/**
 * GMAT Study PWA - Question Templates
 * Version 8.0 - All Questions Parameterized
 *
 * DEVELOPER NOTES:
 * ================
 *
 * WHERE TEMPLATES LIVE:
 * - All question templates are defined in the QUESTION_TEMPLATES array below
 * - Each template has: id, section, tags, generate(rng) function
 *
 * HOW PARAMETERS ARE GENERATED:
 * - Each template's generate(rng) function receives a seeded RNG
 * - Parameters are picked using pickInt(), pickFrom() utilities
 * - Constraints ensure numbers are "clean" (no messy decimals)
 *
 * HOW CORRECTNESS IS COMPUTED:
 * - Each step has a computeAnswer(params) function
 * - Distractors are generated from common mistakes
 * - Correct answer is always verified before returning
 *
 * HOW RESTART LOGIC TRIGGERS:
 * - See app.js: checkAnswer() function
 * - 1st wrong: mark incorrect, NO hint
 * - 2nd wrong: immediate quiz restart
 */

(function(global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Seeded RNG using Mulberry32 algorithm
   */
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

  /**
   * GCD calculation for fraction problems
   */
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  /**
   * Create choices array with correct answer and distractors
   * Ensures all choices are unique and correct answer is included
   */
  function makeChoices(rng, correct, distractors, count = 4) {
    const correctStr = String(correct);
    const uniqueDistractors = [...new Set(distractors.map(String))]
      .filter(d => d !== correctStr)
      .slice(0, count - 1);

    // If we need more distractors, generate variations
    while (uniqueDistractors.length < count - 1) {
      const variation = typeof correct === 'number'
        ? correct + pickInt(rng, 1, 5) * (rng() > 0.5 ? 1 : -1)
        : `${correct}*`;
      const varStr = String(variation);
      if (!uniqueDistractors.includes(varStr) && varStr !== correctStr) {
        uniqueDistractors.push(varStr);
      }
    }

    const choices = [correctStr, ...uniqueDistractors.slice(0, count - 1)];
    const shuffled = shuffle(rng, choices);
    return {
      choices: shuffled,
      answerIndex: shuffled.indexOf(correctStr)
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // QUESTION TEMPLATES
  // Each template generates a complete question with randomized params
  // ═══════════════════════════════════════════════════════════════

  const QUESTION_TEMPLATES = [
    // ─────────────────────────────────────────────────────────────
    // 1. PERCENTAGE CALCULATION
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-percentage',
      section: 'quant',
      tags: ['percentages', 'arithmetic'],
      generate: function(rng) {
        const percent = pickFrom(rng, [10, 15, 20, 25, 30, 40, 50, 60, 75]);
        const base = pickFrom(rng, [80, 100, 120, 160, 200, 240, 300, 400, 500]);
        const answer = (percent * base) / 100;

        return {
          fullQuestion: `What is ${percent}% of ${base}?`,
          finalAnswer: answer,
          steps: [
            {
              prompt: `Step 1: To find ${percent}% of a number, convert to decimal. ${percent}% = ?`,
              ...makeChoices(rng, percent / 100, [percent, percent / 10, percent / 1000])
            },
            {
              prompt: `Step 2: Multiply ${percent / 100} × ${base} = ?`,
              ...makeChoices(rng, answer, [answer + 10, answer - 10, answer * 2, base])
            },
            {
              prompt: `Final: What is ${percent}% of ${base}?`,
              ...makeChoices(rng, answer, [answer + 20, answer - 20, answer * 2, percent + base], 5)
            }
          ],
          cheatsheet: {
            title: 'Percentage Calculation',
            body: `To find ${percent}% of ${base}: Convert ${percent}% to ${percent/100}, then multiply by ${base}.`,
            steps: [`Convert: ${percent}% = ${percent}/100 = ${percent/100}`, `Calculate: ${percent/100} × ${base} = ${answer}`],
            keyFormulas: ['X% of N = (X/100) × N']
          },
          flashcard: {
            front: `What is ${percent}% of ${base}?`,
            back: `${answer} — Convert to decimal (${percent/100}) and multiply by ${base}.`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 2. DISTANCE-RATE-TIME
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-distance-rate-time',
      section: 'quant',
      tags: ['rates', 'distance', 'time'],
      generate: function(rng) {
        const speed = pickFrom(rng, [30, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
        const hours = pickFrom(rng, [2, 3, 4, 5, 6, 8]);
        const distance = speed * hours;

        return {
          fullQuestion: `A car travels ${distance} miles in ${hours} hours. What is the car's average speed in miles per hour?`,
          finalAnswer: speed,
          steps: [
            {
              prompt: `Step 1: The formula for average speed is:`,
              ...makeChoices(rng, 'Distance ÷ Time', ['Distance × Time', 'Time ÷ Distance', 'Distance + Time'])
            },
            {
              prompt: `Step 2: Calculate: ${distance} miles ÷ ${hours} hours = ?`,
              ...makeChoices(rng, speed, [speed + 10, speed - 10, distance, hours])
            },
            {
              prompt: `Final: A car travels ${distance} miles in ${hours} hours. What is the average speed in mph?`,
              ...makeChoices(rng, speed, [speed + 5, speed - 5, speed + 15, speed - 15], 5)
            }
          ],
          cheatsheet: {
            title: 'Distance, Rate, and Time',
            body: `Speed = Distance / Time = ${distance} / ${hours} = ${speed} mph`,
            steps: [`Distance = ${distance} miles`, `Time = ${hours} hours`, `Speed = ${distance} ÷ ${hours} = ${speed} mph`],
            keyFormulas: ['Speed = Distance / Time', 'Distance = Speed × Time']
          },
          flashcard: {
            front: `A car travels ${distance} miles in ${hours} hours. What's the speed?`,
            back: `${speed} mph — Speed = Distance / Time = ${distance}/${hours}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 3. SIMPLE INTEREST
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-simple-interest',
      section: 'quant',
      tags: ['interest', 'finance', 'percentages'],
      generate: function(rng) {
        const principal = pickFrom(rng, [1000, 2000, 2500, 3000, 4000, 5000]);
        const rate = pickFrom(rng, [2, 3, 4, 5, 6, 8, 10]);
        const years = pickFrom(rng, [2, 3, 4, 5]);
        const interest = (principal * rate * years) / 100;

        return {
          fullQuestion: `If $${principal} is invested at ${rate}% simple annual interest, how much interest is earned after ${years} years?`,
          finalAnswer: interest,
          steps: [
            {
              prompt: `Step 1: The simple interest formula is I = P × r × t. What is r for ${rate}%?`,
              ...makeChoices(rng, rate / 100, [rate, rate / 10, rate * 100])
            },
            {
              prompt: `Step 2: Calculate P × r = $${principal} × ${rate / 100} = ?`,
              ...makeChoices(rng, principal * rate / 100, [principal + rate, principal - rate, principal])
            },
            {
              prompt: `Step 3: Multiply by time: $${principal * rate / 100} × ${years} = ?`,
              ...makeChoices(rng, interest, [interest + 100, interest - 50, interest * 2])
            },
            {
              prompt: `Final: How much interest is earned on $${principal} at ${rate}% for ${years} years?`,
              ...makeChoices(rng, interest, [interest + principal, principal, interest * 2, interest / 2], 5)
            }
          ],
          cheatsheet: {
            title: 'Simple Interest',
            body: `I = P × r × t = $${principal} × ${rate/100} × ${years} = $${interest}`,
            steps: [`P = $${principal}`, `r = ${rate}% = ${rate/100}`, `t = ${years} years`, `I = ${principal} × ${rate/100} × ${years} = $${interest}`],
            keyFormulas: ['I = P × r × t']
          },
          flashcard: {
            front: `Simple interest on $${principal} at ${rate}% for ${years} years?`,
            back: `$${interest} — I = P×r×t = ${principal}×${rate/100}×${years}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 4. RATIO PROBLEMS
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-ratio-problem',
      section: 'quant',
      tags: ['ratios', 'algebra'],
      generate: function(rng) {
        const aRatio = pickFrom(rng, [2, 3, 4, 5]);
        let bRatio = pickFrom(rng, [3, 4, 5, 7]);
        while (bRatio === aRatio) bRatio = pickFrom(rng, [3, 4, 5, 7]);
        const multiplier = pickFrom(rng, [4, 5, 6, 8, 10]);
        const total = (aRatio + bRatio) * multiplier;
        const partA = aRatio * multiplier;
        const partB = bRatio * multiplier;

        return {
          fullQuestion: `If the ratio of boys to girls in a class is ${aRatio}:${bRatio}, and there are ${total} students in total, how many boys are in the class?`,
          finalAnswer: partA,
          steps: [
            {
              prompt: `Step 1: In a ${aRatio}:${bRatio} ratio, total parts = ?`,
              ...makeChoices(rng, aRatio + bRatio, [aRatio * bRatio, aRatio - bRatio, aRatio])
            },
            {
              prompt: `Step 2: If ${total} students and ${aRatio + bRatio} parts, each part = ?`,
              ...makeChoices(rng, multiplier, [multiplier + 1, multiplier - 1, multiplier * 2])
            },
            {
              prompt: `Step 3: Boys = ${aRatio} parts × ${multiplier} = ?`,
              ...makeChoices(rng, partA, [partB, total, partA + 5])
            },
            {
              prompt: `Final: In a ${aRatio}:${bRatio} ratio with ${total} students, how many boys?`,
              ...makeChoices(rng, partA, [partB, total - partA + 5, multiplier, aRatio], 5)
            }
          ],
          cheatsheet: {
            title: 'Ratio Problems',
            body: `Ratio ${aRatio}:${bRatio} with total ${total}: Each part = ${total}/${aRatio + bRatio} = ${multiplier}`,
            steps: [`Total parts: ${aRatio} + ${bRatio} = ${aRatio + bRatio}`, `Each part: ${total} ÷ ${aRatio + bRatio} = ${multiplier}`, `Boys: ${aRatio} × ${multiplier} = ${partA}`],
            keyFormulas: ['Total = (a+b) × multiplier', 'Part A = a × multiplier']
          },
          flashcard: {
            front: `Ratio ${aRatio}:${bRatio}, total ${total}. How many in first group?`,
            back: `${partA} — Each part = ${multiplier}, first group = ${aRatio} × ${multiplier}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 5. FRACTION SIMPLIFICATION
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-fraction-simplify',
      section: 'quant',
      tags: ['fractions', 'GCF', 'simplification'],
      generate: function(rng) {
        const gcf = pickFrom(rng, [2, 3, 4, 5, 6]);
        const simpNum = pickFrom(rng, [2, 3, 4, 5, 7]);
        let simpDen = pickFrom(rng, [3, 4, 5, 7, 8, 9]);
        while (simpDen === simpNum || gcd(simpNum, simpDen) > 1) {
          simpDen = pickFrom(rng, [3, 4, 5, 7, 8, 9, 11]);
        }
        const num = simpNum * gcf;
        const den = simpDen * gcf;

        return {
          fullQuestion: `What is the simplified form of ${num}/${den}?`,
          finalAnswer: `${simpNum}/${simpDen}`,
          steps: [
            {
              prompt: `Step 1: To simplify, divide by the GCF. Find GCF(${num}, ${den}):`,
              ...makeChoices(rng, gcf, [gcf - 1, gcf + 1, num, 1])
            },
            {
              prompt: `Step 2: Divide both by ${gcf}: ${num}÷${gcf} = ${simpNum}, ${den}÷${gcf} = ?`,
              ...makeChoices(rng, simpDen, [simpDen + 1, simpDen - 1, den])
            },
            {
              prompt: `Final: What is ${num}/${den} simplified?`,
              ...makeChoices(rng, `${simpNum}/${simpDen}`, [`${simpDen}/${simpNum}`, `${simpNum + 1}/${simpDen}`, `${num}/${den}`], 4)
            }
          ],
          cheatsheet: {
            title: 'Simplifying Fractions',
            body: `${num}/${den}: GCF = ${gcf}, so ${num}/${den} = ${simpNum}/${simpDen}`,
            steps: [`Find GCF(${num}, ${den}) = ${gcf}`, `Divide: ${num}÷${gcf} = ${simpNum}`, `Divide: ${den}÷${gcf} = ${simpDen}`, `Result: ${simpNum}/${simpDen}`],
            keyFormulas: ['GCF = Greatest Common Factor']
          },
          flashcard: {
            front: `Simplify ${num}/${den}`,
            back: `${simpNum}/${simpDen} — Divide both by GCF(${gcf})`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 6. WEIGHTED AVERAGE
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-weighted-average',
      section: 'quant',
      tags: ['averages', 'statistics'],
      generate: function(rng) {
        const n1 = pickFrom(rng, [2, 3, 4]);
        const n2 = pickFrom(rng, [1, 2]);
        const n3 = pickFrom(rng, [2, 3, 4]);
        const v1 = pickFrom(rng, [12, 14, 15, 16]) * 1000;
        const v2 = pickFrom(rng, [16, 17, 18]) * 1000;
        const v3 = pickFrom(rng, [17, 18, 19, 20]) * 1000;
        const total = n1 + n2 + n3;
        const sum = n1 * v1 + n2 * v2 + n3 * v3;
        const avg = Math.round(sum / total);

        // Find closest "round" answer
        const roundedAvg = Math.round(avg / 100) * 100;

        return {
          fullQuestion: `A bakery has ${total} employees: ${n1} earn $${v1.toLocaleString()}, ${n2} earn $${v2.toLocaleString()}, and ${n3} earn $${v3.toLocaleString()}. What is the average salary (rounded to nearest $100)?`,
          finalAnswer: roundedAvg,
          steps: [
            {
              prompt: `Step 1: Calculate total salary: ${n1}×$${v1.toLocaleString()} + ${n2}×$${v2.toLocaleString()} + ${n3}×$${v3.toLocaleString()} = ?`,
              ...makeChoices(rng, sum, [sum + 1000, sum - 1000, sum + 5000])
            },
            {
              prompt: `Step 2: Average = $${sum.toLocaleString()} ÷ ${total} = ?`,
              ...makeChoices(rng, avg, [avg + 500, avg - 500, avg + 1000])
            },
            {
              prompt: `Final: The average salary rounded to nearest $100 is:`,
              ...makeChoices(rng, roundedAvg, [roundedAvg + 200, roundedAvg - 200, roundedAvg + 500, roundedAvg - 500], 5)
            }
          ],
          cheatsheet: {
            title: 'Weighted Average',
            body: `Total salary = $${sum.toLocaleString()}, employees = ${total}, avg ≈ $${roundedAvg.toLocaleString()}`,
            steps: [`Sum: ${n1}×${v1} + ${n2}×${v2} + ${n3}×${v3} = ${sum}`, `Average: ${sum} ÷ ${total} = ${avg}`, `Rounded: $${roundedAvg}`],
            keyFormulas: ['Average = Total Sum / Count']
          },
          flashcard: {
            front: `${total} employees earning $${v1}/${v2}/${v3}. Average?`,
            back: `≈$${roundedAvg.toLocaleString()} — Total $${sum.toLocaleString()} ÷ ${total}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 7. EXPONENT RULES
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-exponent-rules',
      section: 'quant',
      tags: ['exponents', 'algebra'],
      generate: function(rng) {
        const base = pickFrom(rng, [2, 3, 5]);
        const exp1 = pickFrom(rng, [2, 3, 4]);
        const exp2 = pickFrom(rng, [2, 3, 4]);
        const sumExp = exp1 + exp2;
        const result = Math.pow(base, sumExp);

        return {
          fullQuestion: `Simplify: ${base}^${exp1} × ${base}^${exp2}`,
          finalAnswer: `${base}^${sumExp}`,
          steps: [
            {
              prompt: `Step 1: When multiplying same bases, we ___ the exponents:`,
              ...makeChoices(rng, 'add', ['multiply', 'subtract', 'divide'])
            },
            {
              prompt: `Step 2: ${exp1} + ${exp2} = ?`,
              ...makeChoices(rng, sumExp, [exp1 * exp2, sumExp + 1, sumExp - 1])
            },
            {
              prompt: `Final: ${base}^${exp1} × ${base}^${exp2} = ?`,
              ...makeChoices(rng, `${base}^${sumExp}`, [`${base}^${exp1 * exp2}`, `${base * 2}^${sumExp}`, `${base}^${sumExp - 1}`], 4)
            }
          ],
          cheatsheet: {
            title: 'Exponent Multiplication Rule',
            body: `${base}^${exp1} × ${base}^${exp2} = ${base}^(${exp1}+${exp2}) = ${base}^${sumExp}`,
            steps: [`Same base: add exponents`, `${exp1} + ${exp2} = ${sumExp}`, `Result: ${base}^${sumExp} = ${result}`],
            keyFormulas: ['a^m × a^n = a^(m+n)']
          },
          flashcard: {
            front: `${base}^${exp1} × ${base}^${exp2} = ?`,
            back: `${base}^${sumExp} — Add exponents when multiplying same bases`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 8. MIXTURE PROBLEMS
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-mixture',
      section: 'quant',
      tags: ['mixtures', 'algebra', 'percentages'],
      generate: function(rng) {
        const total = pickFrom(rng, [200, 250, 300, 400]);
        const pctX = pickFrom(rng, [10, 12, 15, 20]);
        const pctY = pickFrom(rng, [25, 30, 35, 40]);
        // Pick X amount that gives clean total concentration
        const amtX = pickFrom(rng, [80, 100, 120, 140, 160].filter(x => x < total));
        const amtY = total - amtX;
        const totalConc = (pctX * amtX + pctY * amtY) / 100;

        return {
          fullQuestion: `A ${total}g mixture contains food X (${pctX}% protein) and food Y (${pctY}% protein). If there are ${amtX}g of food X, how many grams of protein are in the mixture?`,
          finalAnswer: totalConc,
          steps: [
            {
              prompt: `Step 1: Protein from X = ${pctX}% of ${amtX}g = ?`,
              ...makeChoices(rng, pctX * amtX / 100, [amtX, pctX, pctX * amtX / 10])
            },
            {
              prompt: `Step 2: Food Y = ${total} - ${amtX} = ${amtY}g. Protein from Y = ${pctY}% of ${amtY} = ?`,
              ...makeChoices(rng, pctY * amtY / 100, [amtY, pctY, pctY * amtY / 10])
            },
            {
              prompt: `Final: Total protein = ${pctX * amtX / 100} + ${pctY * amtY / 100} = ?`,
              ...makeChoices(rng, totalConc, [totalConc + 5, totalConc - 5, total], 4)
            }
          ],
          cheatsheet: {
            title: 'Mixture Problems',
            body: `X: ${amtX}g at ${pctX}% = ${pctX * amtX / 100}g protein. Y: ${amtY}g at ${pctY}% = ${pctY * amtY / 100}g protein.`,
            steps: [`Protein from X: ${pctX/100} × ${amtX} = ${pctX * amtX / 100}`, `Protein from Y: ${pctY/100} × ${amtY} = ${pctY * amtY / 100}`, `Total: ${totalConc}g`],
            keyFormulas: ['Total = (%₁ × amt₁) + (%₂ × amt₂)']
          },
          flashcard: {
            front: `${amtX}g at ${pctX}% + ${amtY}g at ${pctY}%. Total protein?`,
            back: `${totalConc}g — Add protein from each component`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 9. QUADRATIC VERTEX
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-quadratic-vertex',
      section: 'quant',
      tags: ['quadratics', 'optimization'],
      generate: function(rng) {
        const h = pickFrom(rng, [2, 3, 4, 5, 6]);
        const k = pickFrom(rng, [2, 3, 4, 5, 6, 8]);

        return {
          fullQuestion: `If y = ${k} + (x − ${h})², what value of x minimizes y?`,
          finalAnswer: h,
          steps: [
            {
              prompt: `Step 1: The expression (x − ${h})² is minimized when it equals:`,
              ...makeChoices(rng, 0, [1, h, k])
            },
            {
              prompt: `Step 2: (x − ${h})² = 0 when x = ?`,
              ...makeChoices(rng, h, [h + 1, h - 1, k, 0])
            },
            {
              prompt: `Final: y = ${k} + (x − ${h})² is minimized when x = ?`,
              ...makeChoices(rng, h, [k, h + k, 0, h - 1], 5)
            }
          ],
          cheatsheet: {
            title: 'Quadratic Minimum',
            body: `y = ${k} + (x − ${h})² has minimum at x = ${h} where y = ${k}`,
            steps: [`Squared terms are always ≥ 0`, `(x − ${h})² = 0 when x = ${h}`, `Minimum y = ${k} + 0 = ${k}`],
            keyFormulas: ['y = k + (x−h)² has minimum at x = h']
          },
          flashcard: {
            front: `Where is y = ${k} + (x − ${h})² minimized?`,
            back: `At x = ${h} — The square equals 0 there`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 10. UNITS DIGIT
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-units-digit',
      section: 'quant',
      tags: ['number-theory', 'patterns'],
      generate: function(rng) {
        const base = pickFrom(rng, [2, 3, 7, 8]);
        const exp = pickFrom(rng, [10, 11, 12, 13, 14, 15, 23, 24, 25]);

        // Units digit patterns
        const patterns = {
          2: [2, 4, 8, 6],
          3: [3, 9, 7, 1],
          7: [7, 9, 3, 1],
          8: [8, 4, 2, 6]
        };
        const pattern = patterns[base];
        const unitsDigit = pattern[(exp - 1) % 4];

        return {
          fullQuestion: `What is the units digit of ${base}^${exp}?`,
          finalAnswer: unitsDigit,
          steps: [
            {
              prompt: `Step 1: The units digit of powers of ${base} follows a pattern. ${base}¹=${base}, ${base}²=${base*base}. The pattern repeats every:`,
              ...makeChoices(rng, 4, [2, 3, 5, 6])
            },
            {
              prompt: `Step 2: ${exp} mod 4 = ${exp % 4 || 4}. This corresponds to position ${exp % 4 || 4} in the cycle. The units digit is:`,
              ...makeChoices(rng, unitsDigit, pattern.filter(d => d !== unitsDigit))
            },
            {
              prompt: `Final: The units digit of ${base}^${exp} is:`,
              ...makeChoices(rng, unitsDigit, [2, 4, 6, 8].filter(d => d !== unitsDigit), 4)
            }
          ],
          cheatsheet: {
            title: 'Units Digit Patterns',
            body: `Powers of ${base}: units digits cycle ${pattern.join(', ')}. ${base}^${exp} has units digit ${unitsDigit}.`,
            steps: [`Pattern: ${pattern.join(' → ')} (repeats every 4)`, `${exp} mod 4 = ${exp % 4 || 4}`, `Position ${exp % 4 || 4} → units digit ${unitsDigit}`],
            keyFormulas: ['Patterns of 2: 2,4,8,6', 'Patterns of 3: 3,9,7,1']
          },
          flashcard: {
            front: `Units digit of ${base}^${exp}?`,
            back: `${unitsDigit} — Pattern cycles every 4, position ${exp % 4 || 4}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 11. LINEAR EQUATION
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-linear-equation',
      section: 'quant',
      tags: ['algebra', 'equations'],
      generate: function(rng) {
        const a = pickFrom(rng, [2, 3, 4, 5]);
        const x = pickFrom(rng, [3, 4, 5, 6, 7, 8]);
        const b = pickFrom(rng, [5, 7, 10, 12, 15]);
        const result = a * x + b;

        return {
          fullQuestion: `Solve for x: ${a}x + ${b} = ${result}`,
          finalAnswer: x,
          steps: [
            {
              prompt: `Step 1: Subtract ${b} from both sides: ${a}x = ?`,
              ...makeChoices(rng, result - b, [result + b, result, b])
            },
            {
              prompt: `Step 2: Divide both sides by ${a}: x = ${result - b} ÷ ${a} = ?`,
              ...makeChoices(rng, x, [x + 1, x - 1, x * 2])
            },
            {
              prompt: `Final: In ${a}x + ${b} = ${result}, x = ?`,
              ...makeChoices(rng, x, [x + 2, x - 2, result / a, a], 5)
            }
          ],
          cheatsheet: {
            title: 'Solving Linear Equations',
            body: `${a}x + ${b} = ${result} → ${a}x = ${result - b} → x = ${x}`,
            steps: [`Subtract ${b}: ${a}x = ${result - b}`, `Divide by ${a}: x = ${(result - b) / a}`],
            keyFormulas: ['Isolate variable step by step']
          },
          flashcard: {
            front: `${a}x + ${b} = ${result}. Solve for x.`,
            back: `x = ${x} — Subtract ${b}, divide by ${a}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 12. PROFIT/LOSS
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-profit-loss',
      section: 'quant',
      tags: ['percentages', 'business'],
      generate: function(rng) {
        const cost = pickFrom(rng, [50, 80, 100, 120, 150, 200]);
        const profitPct = pickFrom(rng, [10, 15, 20, 25, 30, 40]);
        const profit = (cost * profitPct) / 100;
        const sellPrice = cost + profit;

        return {
          fullQuestion: `An item costs $${cost}. If sold at ${profitPct}% profit, what is the selling price?`,
          finalAnswer: sellPrice,
          steps: [
            {
              prompt: `Step 1: Calculate ${profitPct}% of $${cost}:`,
              ...makeChoices(rng, profit, [profit + 5, cost, profitPct])
            },
            {
              prompt: `Step 2: Selling price = Cost + Profit = $${cost} + $${profit} = ?`,
              ...makeChoices(rng, sellPrice, [sellPrice + 10, cost, profit])
            },
            {
              prompt: `Final: Selling price for ${profitPct}% profit on $${cost} cost:`,
              ...makeChoices(rng, sellPrice, [sellPrice + 20, cost + profitPct, cost * 2], 4)
            }
          ],
          cheatsheet: {
            title: 'Profit Calculation',
            body: `Cost = $${cost}, Profit = ${profitPct}% = $${profit}, Selling Price = $${sellPrice}`,
            steps: [`Profit = ${profitPct/100} × $${cost} = $${profit}`, `Selling Price = $${cost} + $${profit} = $${sellPrice}`],
            keyFormulas: ['Profit = Cost × Profit%', 'SP = Cost + Profit']
          },
          flashcard: {
            front: `$${cost} cost, ${profitPct}% profit. Selling price?`,
            back: `$${sellPrice} — Profit = $${profit}, add to cost`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 13. WORK PROBLEMS
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-work-rate',
      section: 'quant',
      tags: ['rates', 'work'],
      generate: function(rng) {
        const timeA = pickFrom(rng, [4, 5, 6, 8, 10]);
        const timeB = pickFrom(rng, [3, 4, 5, 6, 8].filter(t => t !== timeA));
        // Combined rate: 1/a + 1/b = (a+b)/(a*b)
        // Combined time = ab/(a+b)
        const combined = (timeA * timeB) / (timeA + timeB);
        const roundedCombined = Math.round(combined * 10) / 10;

        return {
          fullQuestion: `Worker A completes a job in ${timeA} hours, Worker B in ${timeB} hours. Working together, how many hours to complete the job?`,
          finalAnswer: roundedCombined,
          steps: [
            {
              prompt: `Step 1: A's rate = 1/${timeA} job/hr. B's rate = 1/${timeB} job/hr. Combined rate = ?`,
              ...makeChoices(rng, `1/${timeA} + 1/${timeB}`, [`1/${timeA} - 1/${timeB}`, `1/${timeA} × 1/${timeB}`, `${timeA} + ${timeB}`])
            },
            {
              prompt: `Step 2: 1/${timeA} + 1/${timeB} = ${timeB}/${timeA * timeB} + ${timeA}/${timeA * timeB} = ?`,
              ...makeChoices(rng, `${timeA + timeB}/${timeA * timeB}`, [`${timeA * timeB}/${timeA + timeB}`, `1/${timeA + timeB}`, `${timeA}/${timeB}`])
            },
            {
              prompt: `Final: Time = 1 ÷ (${timeA + timeB}/${timeA * timeB}) = ${timeA * timeB}/${timeA + timeB} ≈ ?`,
              ...makeChoices(rng, roundedCombined, [roundedCombined + 1, roundedCombined - 0.5, timeA + timeB], 4)
            }
          ],
          cheatsheet: {
            title: 'Combined Work Rate',
            body: `A: ${timeA}h, B: ${timeB}h. Together: ${timeA * timeB}/${timeA + timeB} ≈ ${roundedCombined}h`,
            steps: [`Rate A = 1/${timeA}`, `Rate B = 1/${timeB}`, `Combined = (${timeA}+${timeB})/${timeA * timeB}`, `Time = ${timeA * timeB}/${timeA + timeB} ≈ ${roundedCombined}`],
            keyFormulas: ['Combined Time = (A×B)/(A+B)']
          },
          flashcard: {
            front: `A: ${timeA}h alone, B: ${timeB}h alone. Together?`,
            back: `≈${roundedCombined} hours — Use formula (A×B)/(A+B)`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 14. CONSECUTIVE INTEGERS
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-consecutive-integers',
      section: 'quant',
      tags: ['algebra', 'integers'],
      generate: function(rng) {
        const n = pickFrom(rng, [3, 4, 5]);
        const first = pickFrom(rng, [10, 12, 15, 20, 25, 30]);
        const sum = n * first + (n * (n - 1)) / 2;

        return {
          fullQuestion: `The sum of ${n} consecutive integers is ${sum}. What is the smallest of these integers?`,
          finalAnswer: first,
          steps: [
            {
              prompt: `Step 1: For ${n} consecutive integers starting at x, the sum formula is:`,
              ...makeChoices(rng, `${n}x + ${(n * (n - 1)) / 2}`, [`${n}x`, `${n}x + ${n}`, `x + ${n}`])
            },
            {
              prompt: `Step 2: Set ${n}x + ${(n * (n - 1)) / 2} = ${sum}. So ${n}x = ?`,
              ...makeChoices(rng, sum - (n * (n - 1)) / 2, [sum, sum + n, sum - n])
            },
            {
              prompt: `Final: x = ${sum - (n * (n - 1)) / 2} ÷ ${n} = ?`,
              ...makeChoices(rng, first, [first + 1, first - 1, first + n], 4)
            }
          ],
          cheatsheet: {
            title: 'Consecutive Integer Sum',
            body: `${n} consecutive integers summing to ${sum}: ${first}, ${first + 1}, ..., ${first + n - 1}`,
            steps: [`Let first = x`, `Sum = ${n}x + ${(n * (n - 1)) / 2} = ${sum}`, `x = ${first}`],
            keyFormulas: ['Sum of n consecutive from x = nx + n(n-1)/2']
          },
          flashcard: {
            front: `${n} consecutive integers sum to ${sum}. Smallest?`,
            back: `${first} — The integers are ${first} to ${first + n - 1}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 15. ABSOLUTE VALUE
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-absolute-value',
      section: 'quant',
      tags: ['algebra', 'absolute-value'],
      generate: function(rng) {
        const a = pickFrom(rng, [2, 3, 4, 5]);
        const result = pickFrom(rng, [6, 8, 10, 12, 15]);
        const sol1 = result / a;
        const sol2 = -result / a;

        return {
          fullQuestion: `If |${a}x| = ${result}, what are the possible values of x?`,
          finalAnswer: `${sol1} or ${sol2}`,
          steps: [
            {
              prompt: `Step 1: |${a}x| = ${result} means ${a}x = ${result} or ${a}x = ?`,
              ...makeChoices(rng, -result, [result, 0, result / 2])
            },
            {
              prompt: `Step 2: From ${a}x = ${result}: x = ?`,
              ...makeChoices(rng, sol1, [sol1 + 1, -sol1, result])
            },
            {
              prompt: `Final: The solutions are x = ?`,
              ...makeChoices(rng, `${sol1} or ${sol2}`, [`${sol1} only`, `${sol2} only`, `0`], 4)
            }
          ],
          cheatsheet: {
            title: 'Absolute Value Equations',
            body: `|${a}x| = ${result} → x = ${sol1} or x = ${sol2}`,
            steps: [`Case 1: ${a}x = ${result} → x = ${sol1}`, `Case 2: ${a}x = ${-result} → x = ${sol2}`],
            keyFormulas: ['|ax| = b → ax = b or ax = -b']
          },
          flashcard: {
            front: `|${a}x| = ${result}. Values of x?`,
            back: `x = ${sol1} or ${sol2} — Two cases for absolute value`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 16. SQUARE ROOT SIMPLIFICATION
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-sqrt-simplify',
      section: 'quant',
      tags: ['radicals', 'simplification'],
      generate: function(rng) {
        const factor = pickFrom(rng, [2, 3, 4, 5, 6]);
        const perfectSq = pickFrom(rng, [4, 9, 16, 25, 36]);
        const root = Math.sqrt(perfectSq);
        const radicand = perfectSq * factor;

        return {
          fullQuestion: `Simplify: √${radicand}`,
          finalAnswer: `${root}√${factor}`,
          steps: [
            {
              prompt: `Step 1: Factor ${radicand} to find a perfect square: ${radicand} = ${perfectSq} × ?`,
              ...makeChoices(rng, factor, [factor + 1, factor - 1, radicand / 2])
            },
            {
              prompt: `Step 2: √${perfectSq} = ?`,
              ...makeChoices(rng, root, [root + 1, root - 1, perfectSq])
            },
            {
              prompt: `Final: √${radicand} = √(${perfectSq} × ${factor}) = ?`,
              ...makeChoices(rng, `${root}√${factor}`, [`√${radicand}`, `${factor}√${root}`, `${root * factor}`], 4)
            }
          ],
          cheatsheet: {
            title: 'Simplifying Square Roots',
            body: `√${radicand} = √(${perfectSq}×${factor}) = √${perfectSq} × √${factor} = ${root}√${factor}`,
            steps: [`Factor: ${radicand} = ${perfectSq} × ${factor}`, `√${perfectSq} = ${root}`, `Result: ${root}√${factor}`],
            keyFormulas: ['√(ab) = √a × √b']
          },
          flashcard: {
            front: `Simplify √${radicand}`,
            back: `${root}√${factor} — Factor out perfect square ${perfectSq}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 17. PROBABILITY
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-probability',
      section: 'quant',
      tags: ['probability', 'statistics'],
      generate: function(rng) {
        const favorable = pickFrom(rng, [2, 3, 4, 5, 6]);
        const total = pickFrom(rng, [10, 12, 15, 20].filter(t => t > favorable));
        const g = gcd(favorable, total);
        const simpNum = favorable / g;
        const simpDen = total / g;

        return {
          fullQuestion: `A bag has ${total} balls, ${favorable} are red. What is the probability of drawing a red ball?`,
          finalAnswer: `${simpNum}/${simpDen}`,
          steps: [
            {
              prompt: `Step 1: Probability = favorable outcomes / total outcomes = ?`,
              ...makeChoices(rng, `${favorable}/${total}`, [`${total}/${favorable}`, `${favorable}`, `${total}`])
            },
            {
              prompt: `Step 2: Simplify ${favorable}/${total}. GCF(${favorable}, ${total}) = ?`,
              ...makeChoices(rng, g, [g + 1, 1, favorable])
            },
            {
              prompt: `Final: Probability of drawing red = ?`,
              ...makeChoices(rng, `${simpNum}/${simpDen}`, [`${simpDen}/${simpNum}`, `${favorable}/${total + 1}`, `${simpNum + 1}/${simpDen}`], 4)
            }
          ],
          cheatsheet: {
            title: 'Basic Probability',
            body: `P(red) = ${favorable}/${total} = ${simpNum}/${simpDen}`,
            steps: [`Favorable: ${favorable} red balls`, `Total: ${total} balls`, `P = ${favorable}/${total} = ${simpNum}/${simpDen}`],
            keyFormulas: ['P(event) = favorable/total']
          },
          flashcard: {
            front: `${favorable} red out of ${total} balls. P(red)?`,
            back: `${simpNum}/${simpDen} — Simplify ${favorable}/${total}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 18. SYSTEM OF EQUATIONS
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-system-equations',
      section: 'quant',
      tags: ['algebra', 'systems'],
      generate: function(rng) {
        const x = pickFrom(rng, [2, 3, 4, 5]);
        const y = pickFrom(rng, [1, 2, 3, 4].filter(v => v !== x));
        const sum = x + y;
        const diff = x - y;

        return {
          fullQuestion: `If x + y = ${sum} and x - y = ${diff}, what is x?`,
          finalAnswer: x,
          steps: [
            {
              prompt: `Step 1: Add the equations: (x+y) + (x-y) = ${sum} + ${diff} = ?`,
              ...makeChoices(rng, sum + diff, [sum - diff, sum * diff, sum])
            },
            {
              prompt: `Step 2: 2x = ${sum + diff}, so x = ?`,
              ...makeChoices(rng, x, [y, sum, diff])
            },
            {
              prompt: `Final: Given x + y = ${sum} and x - y = ${diff}, x = ?`,
              ...makeChoices(rng, x, [y, sum, x + 1], 4)
            }
          ],
          cheatsheet: {
            title: 'Solving Systems by Addition',
            body: `x + y = ${sum}, x - y = ${diff}. Add: 2x = ${sum + diff} → x = ${x}`,
            steps: [`Add equations: 2x = ${sum + diff}`, `x = ${(sum + diff) / 2} = ${x}`, `Substitute: y = ${sum} - ${x} = ${y}`],
            keyFormulas: ['Add/subtract equations to eliminate variables']
          },
          flashcard: {
            front: `x + y = ${sum}, x - y = ${diff}. Find x.`,
            back: `x = ${x} — Add equations: 2x = ${sum + diff}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 19. TRIANGLE INEQUALITY
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-triangle-inequality',
      section: 'quant',
      tags: ['geometry', 'inequalities'],
      generate: function(rng) {
        const a = pickFrom(rng, [3, 4, 5, 6, 7]);
        const b = pickFrom(rng, [5, 6, 7, 8, 9].filter(v => v > a));
        const minC = b - a + 1;
        const maxC = a + b - 1;

        return {
          fullQuestion: `Two sides of a triangle are ${a} and ${b}. If the third side c is an integer, what is the maximum value of c?`,
          finalAnswer: maxC,
          steps: [
            {
              prompt: `Step 1: By triangle inequality, c must be less than:`,
              ...makeChoices(rng, a + b, [a * b, b - a, a + b + 1])
            },
            {
              prompt: `Step 2: c < ${a + b}, so the largest integer c can be is:`,
              ...makeChoices(rng, maxC, [a + b, maxC + 1, a + b - 2])
            },
            {
              prompt: `Final: Maximum integer value of the third side:`,
              ...makeChoices(rng, maxC, [a + b, maxC - 1, b], 4)
            }
          ],
          cheatsheet: {
            title: 'Triangle Inequality',
            body: `Sides ${a} and ${b}: third side must satisfy ${b - a} < c < ${a + b}`,
            steps: [`c < ${a} + ${b} = ${a + b}`, `c > ${b} - ${a} = ${b - a}`, `Max integer c = ${maxC}`],
            keyFormulas: ['|a-b| < c < a+b']
          },
          flashcard: {
            front: `Triangle with sides ${a}, ${b}. Max third side?`,
            back: `${maxC} — Must be less than ${a + b}`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 20. AVERAGE SPEED
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-average-speed-trip',
      section: 'quant',
      tags: ['rates', 'averages'],
      generate: function(rng) {
        const speed1 = pickFrom(rng, [30, 40, 50, 60]);
        const speed2 = pickFrom(rng, [40, 50, 60, 80].filter(s => s !== speed1));
        const distance = pickFrom(rng, [60, 80, 100, 120]);
        // Average speed = 2d / (d/s1 + d/s2) = 2*s1*s2/(s1+s2)
        const avgSpeed = (2 * speed1 * speed2) / (speed1 + speed2);
        const roundedAvg = Math.round(avgSpeed * 10) / 10;

        return {
          fullQuestion: `A car travels ${distance} miles at ${speed1} mph, then returns the same distance at ${speed2} mph. What is the average speed for the round trip?`,
          finalAnswer: roundedAvg,
          steps: [
            {
              prompt: `Step 1: Time for first leg = ${distance}/${speed1} = ${distance / speed1} hours. Time for return = ${distance}/${speed2} = ?`,
              ...makeChoices(rng, distance / speed2, [distance / speed1, distance, speed2])
            },
            {
              prompt: `Step 2: Total distance = 2 × ${distance} = ${2 * distance}. Total time = ${distance / speed1} + ${distance / speed2} = ?`,
              ...makeChoices(rng, distance / speed1 + distance / speed2, [2 * distance / speed1, distance / (speed1 + speed2), distance])
            },
            {
              prompt: `Final: Average speed = ${2 * distance} ÷ ${(distance / speed1 + distance / speed2).toFixed(2)} ≈ ?`,
              ...makeChoices(rng, roundedAvg, [(speed1 + speed2) / 2, roundedAvg + 5, roundedAvg - 5], 4)
            }
          ],
          cheatsheet: {
            title: 'Average Speed for Round Trip',
            body: `Going ${speed1} mph, returning ${speed2} mph. Avg ≠ (${speed1}+${speed2})/2! Use: 2×${speed1}×${speed2}/(${speed1}+${speed2}) = ${roundedAvg}`,
            steps: [`Formula: 2×s₁×s₂/(s₁+s₂)`, `= 2×${speed1}×${speed2}/${speed1 + speed2}`, `= ${roundedAvg} mph`],
            keyFormulas: ['Avg Speed = 2ab/(a+b) for same distance']
          },
          flashcard: {
            front: `${distance}mi at ${speed1}mph, return at ${speed2}mph. Avg speed?`,
            back: `${roundedAvg} mph — Use harmonic mean: 2×${speed1}×${speed2}/(${speed1}+${speed2})`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 21. NUMBER PROPERTIES (Even/Odd)
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-even-odd',
      section: 'quant',
      tags: ['number-theory', 'properties'],
      generate: function(rng) {
        const scenarios = [
          { desc: 'even + even', result: 'even', example: (e1, e2) => `${e1} + ${e2} = ${e1 + e2}` },
          { desc: 'odd + odd', result: 'even', example: (o1, o2) => `${o1} + ${o2} = ${o1 + o2}` },
          { desc: 'even × odd', result: 'even', example: (e, o) => `${e} × ${o} = ${e * o}` },
          { desc: 'odd × odd', result: 'odd', example: (o1, o2) => `${o1} × ${o2} = ${o1 * o2}` }
        ];
        const scenario = pickFrom(rng, scenarios);
        const even1 = pickFrom(rng, [2, 4, 6, 8]);
        const even2 = pickFrom(rng, [2, 4, 6, 8]);
        const odd1 = pickFrom(rng, [3, 5, 7, 9]);
        const odd2 = pickFrom(rng, [3, 5, 7, 9]);

        return {
          fullQuestion: `If x is even and y is odd, is x × y even or odd?`,
          finalAnswer: 'even',
          steps: [
            {
              prompt: `Step 1: An even number can be written as:`,
              ...makeChoices(rng, '2k', ['2k+1', 'k', 'k/2'])
            },
            {
              prompt: `Step 2: Even × anything contains factor of:`,
              ...makeChoices(rng, 2, [1, 3, 'k'])
            },
            {
              prompt: `Final: x × y where x is even is:`,
              ...makeChoices(rng, 'even', ['odd', 'depends', 'neither'], 4)
            }
          ],
          cheatsheet: {
            title: 'Even/Odd Rules',
            body: `Even = 2k, Odd = 2k+1. Even × anything = Even.`,
            steps: [`even × even = even`, `even × odd = even`, `odd × odd = odd`],
            keyFormulas: ['Even × Any = Even', 'Odd × Odd = Odd']
          },
          flashcard: {
            front: `Even × Odd = ?`,
            back: `Even — Multiplying by 2 keeps it even`
          }
        };
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 22. FACTORIAL
    // ─────────────────────────────────────────────────────────────
    {
      id: 'q-factorial-basic',
      section: 'quant',
      tags: ['factorials', 'arithmetic'],
      generate: function(rng) {
        const n = pickFrom(rng, [4, 5, 6]);
        const nMinus1 = n - 1;
        let factorial = 1;
        for (let i = 2; i <= n; i++) factorial *= i;
        let factorialMinus1 = 1;
        for (let i = 2; i <= nMinus1; i++) factorialMinus1 *= i;

        return {
          fullQuestion: `What is ${n}! ÷ ${nMinus1}!?`,
          finalAnswer: n,
          steps: [
            {
              prompt: `Step 1: ${n}! = ${n} × ${nMinus1}!. So ${n}!/${nMinus1}! = ?`,
              ...makeChoices(rng, n, [nMinus1, factorial, n + 1])
            },
            {
              prompt: `Step 2: Verify: ${n}! = ${factorial}, ${nMinus1}! = ${factorialMinus1}. ${factorial}/${factorialMinus1} = ?`,
              ...makeChoices(rng, n, [n - 1, n + 1, nMinus1])
            },
            {
              prompt: `Final: ${n}! ÷ ${nMinus1}! = ?`,
              ...makeChoices(rng, n, [factorial / n, nMinus1, n * 2], 4)
            }
          ],
          cheatsheet: {
            title: 'Factorial Division',
            body: `${n}!/${nMinus1}! = ${n} because ${n}! = ${n} × ${nMinus1}!`,
            steps: [`${n}! = ${n} × ${nMinus1}!`, `${n}!/${nMinus1}! = ${n}`],
            keyFormulas: ['n!/（n-1)! = n']
          },
          flashcard: {
            front: `${n}! ÷ ${nMinus1}! = ?`,
            back: `${n} — n! = n × (n-1)!`
          }
        };
      }
    }
  ];

  // ═══════════════════════════════════════════════════════════════
  // QUESTION GENERATION API
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate a single question from a template
   * @param {Object} template - Question template
   * @param {number} seed - Random seed
   * @returns {Object} Generated question with all fields populated
   */
  function generateQuestion(template, seed) {
    const rng = seedRandom(seed);
    const generated = template.generate(rng);

    return {
      id: template.id,
      section: template.section,
      tags: template.tags,
      variantSeed: seed,
      ...generated,
      quiz: {
        type: 'mcq',
        steps: generated.steps
      }
    };
  }

  /**
   * Generate all questions for a quiz session
   * @param {number} baseSeed - Base seed for the session
   * @param {number} attemptNumber - Attempt number (increments on restart)
   * @param {string} sectionFilter - 'all' or specific section
   * @returns {Array} Array of generated questions
   */
  function generateQuizQuestions(baseSeed, attemptNumber, sectionFilter = 'all') {
    const questions = [];

    QUESTION_TEMPLATES.forEach((template, idx) => {
      if (sectionFilter !== 'all' && template.section !== sectionFilter) {
        return;
      }

      const seed = hashSeed(baseSeed, template.id, attemptNumber);
      questions.push(generateQuestion(template, seed));
    });

    // Shuffle questions using seeded RNG
    const shuffleSeed = hashSeed(baseSeed, 'shuffle', attemptNumber);
    const shuffleRng = seedRandom(shuffleSeed);

    return shuffle(shuffleRng, questions);
  }

  /**
   * Validate that all templates generate correct questions
   * Run this in dev mode to verify parameterization works
   */
  function validateAllTemplates(iterations = 50) {
    const results = {
      passed: 0,
      failed: 0,
      errors: []
    };

    QUESTION_TEMPLATES.forEach(template => {
      for (let i = 0; i < iterations; i++) {
        try {
          const seed = Date.now() + i * 1000;
          const question = generateQuestion(template, seed);

          // Check all steps have valid answerIndex
          question.quiz.steps.forEach((step, stepIdx) => {
            if (step.answerIndex < 0 || step.answerIndex >= step.choices.length) {
              throw new Error(`Invalid answerIndex at step ${stepIdx}`);
            }
            // Check no duplicate choices
            const uniqueChoices = new Set(step.choices);
            if (uniqueChoices.size !== step.choices.length) {
              throw new Error(`Duplicate choices at step ${stepIdx}`);
            }
          });

          results.passed++;
        } catch (e) {
          results.failed++;
          results.errors.push(`${template.id} iteration ${i}: ${e.message}`);
        }
      }
    });

    console.log(`Validation: ${results.passed} passed, ${results.failed} failed`);
    if (results.errors.length > 0) {
      console.log('Errors:', results.errors.slice(0, 10));
    }
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
    VERSION: '8.0'
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionTemplates;
  } else {
    global.QuestionTemplates = QuestionTemplates;
  }

})(typeof window !== 'undefined' ? window : global);
