# GMAT Study PWA

A modern, interactive Progressive Web Application for GMAT quantitative reasoning preparation. Features multi-step multiple choice quizzes, Quizlet-style flashcards, and organized cheatsheets — all working offline.

**Created by Joe Viola** with AI assistance from ChatGPT-5.2, Gemini 3 Pro, and Claude.

---

## Features

### Multi-Step Multiple Choice Quiz System
- **18 verified GMAT-style questions**: Covering exponents, factorials, number theory, algebra, word problems, and more
- **Step-by-step problem solving**: Questions are broken into 3-6 logical steps that guide you through the reasoning process
- **Multiple choice format**: Select from 4-5 answer choices per step
- **Strike system**: Get a step wrong twice, and the quiz restarts with randomized questions to ensure mastery
- **Section filtering**: Practice all questions or focus on specific categories (Quantitative, Verbal, Integrated Reasoning)
- **Fisher-Yates shuffle**: Questions appear in random order each time

### Quizlet-Style Flashcards
- **3D flip animation**: Click or tap to reveal the answer
- **Keyboard navigation**: Use arrow keys (← →) to navigate and spacebar to flip
- **Progress tracking**: Visual progress bar shows your position in the deck
- **Completion screen**: Review again or shuffle the deck when finished
- **Reset functionality**: Start over at any time

### Organized Cheatsheet
- **Grouped by section**: Questions organized under Quantitative, Verbal, and Integrated Reasoning
- **Concept cards**: Each card shows the concept title, detailed explanation, worked example, and key formulas
- **Tag system**: Quick visual identification of topic areas (exponents, algebra, word-problems, etc.)

### Modern UI/UX
- **Material Design 3**: Clean, dark-themed interface with square corners
- **Animated background**: Beautiful Three.js Beams animation
- **Responsive design**: Works on desktop, tablet, and mobile devices
- **Theme toggle**: Switch between dark and light themes
- **Square corner design**: Modern, professional appearance

### Offline-First PWA
- **Works offline**: All content cached for offline access
- **Installable**: Add to home screen on mobile or desktop
- **Fast loading**: Service worker ensures quick startup

---

## Quick Start

1. **Open the app**: Simply open `index.html` in any modern browser
2. **Choose a tab**:
   - **Cheatsheet**: Review concepts, formulas, and worked examples
   - **Flashcards**: Test your recall with flip cards
   - **Quiz**: Practice with multi-step multiple choice problems

### Quiz Instructions
1. Click **START** on the quiz screen
2. Select a section (All, Quantitative, Verbal, or Integrated)
3. Click **Begin Quiz**
4. Read the step prompt and select your answer
5. Click **Check Answer** to verify
6. Complete all steps to move to the next question
7. **Warning**: Two wrong answers on the same step restarts the quiz!

### Flashcard Instructions
1. Click on the card to flip between question and answer
2. Use **Previous** / **Next** buttons or arrow keys to navigate
3. Press **Spacebar** to flip the card
4. Click **Reset Deck** to start over
5. At completion, choose to review again or shuffle

---

## Question Topics (18 Total)

| ID | Topic | Section | Steps |
|----|-------|---------|-------|
| q-exponents-abc | Exponent Substitution with Variables | Quant | 4 |
| q-bonus-optimization | Minimizing Count with Fixed Sum | Quant | 5 |
| q-factorial-powers | Factorial Prime Factorization | Quant | 6 |
| q-divisibility-remainder | Divisibility and Remainders with Powers | Quant | 5 |
| q-nested-radicals | Nested Radicals and Conjugates | Quant | 5 |
| q-integer-equation | Finding Integer Solutions | Quant | 5 |
| q-sqrt-substitution | Substitution for Radical Equations | Quant | 4 |
| q-fraction-simplify | Simplifying Fractions Using GCF | Quant | 4 |
| q-trust-fund | Finding Total from Fractional Parts | Quant | 4 |
| q-mixture-problem | Mixture Problems with Percentages | Quant | 5 |
| q-speed-conversion | Speed and Unit Conversions | Quant | 5 |
| q-average-salary | Weighted Average Calculation | Quant | 4 |
| q-company-employees | Systems of Equations from Word Problems | Quant | 6 |
| q-units-digit | Units Digit Patterns | Quant | 5 |
| q-exponent-system | Solving Exponential Systems | Quant | 5 |
| q-ratio-expression | Working with Ratios | Quant | 3 |
| q-parabola-minimum | Finding Minimum of Quadratic Functions | Quant | 4 |
| q-continued-fraction | Evaluating Continued Fractions | Quant | 5 |

---

## Project Structure

```
gmat_quant_pwa/
├── index.html          # Main HTML entry point
├── app.js              # Core application logic (v6.0 - MCQ system)
├── styles.css          # Complete styling (Material Design 3, square corners)
├── bg.js               # Three.js Beams background animation
├── sw.js               # Service Worker for offline caching
├── manifest.json       # PWA manifest for installability
├── offline.html        # Offline fallback page
├── data/
│   └── content.json    # All quiz questions, flashcards, and cheatsheet content
└── icons/
    ├── icon-192.png    # PWA icon (192x192)
    ├── icon-512.png    # PWA icon (512x512)
    ├── logo.svg        # Vector logo
    └── new_logo.png    # App logo
```

---

## Content Structure

All study content is stored in `data/content.json`. Each item follows this structure:

```json
{
  "id": "unique-id",
  "section": "quant|verbal|integrated",
  "tags": ["topic-tag"],
  "cheatsheet": {
    "title": "Concept Title",
    "body": "Detailed explanation text",
    "example": "Worked example",
    "keyFormulas": ["formula1", "formula2"]
  },
  "flashcard": {
    "front": "Question text",
    "back": "Answer with explanation"
  },
  "quiz": {
    "type": "mcq",
    "steps": [
      {
        "prompt": "Step question text",
        "choices": ["A", "B", "C", "D"],
        "answerIndex": 0
      }
    ]
  }
}
```

---

## Technical Details

### Technologies Used
- **Vanilla JavaScript**: No framework dependencies, fast and lightweight
- **Three.js**: Hardware-accelerated 3D graphics for the animated background
- **CSS Custom Properties**: Themeable design system with Material Design 3 tokens
- **Service Workers**: Offline functionality and caching strategy
- **Web App Manifest**: PWA installability

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

### Performance
- First paint: < 1s
- Time to interactive: < 2s
- Lighthouse PWA score: 100
- Works completely offline after first load

---

## Adding New Questions

1. Open `data/content.json`
2. Add a new item to the `items` array following the structure above
3. Ensure the item has:
   - Unique `id`
   - Valid `section` (quant, verbal, or integrated)
   - At least one `tag`
   - `cheatsheet`, `flashcard`, and `quiz` objects
4. Quiz steps should build logically toward the final answer
5. Use `answerIndex` (0-based) to indicate the correct choice
6. All math should be verified for accuracy

---

## Customization

### Changing Colors
Edit the CSS variables in `styles.css`:

```css
:root {
  --md-primary: #a8c7fa;        /* Primary accent color */
  --md-surface: #0f1419;        /* Background color */
  --md-on-surface: #e2e2e6;     /* Text color */
  /* ... more variables */
}
```

### Adjusting Background Animation
Edit the `CONFIG` object in `bg.js`:

```javascript
const CONFIG = {
  beamWidth: 2,
  beamHeight: 15,
  beamNumber: 12,
  lightColor: '#a8c7fa',
  speed: 2,
  noiseIntensity: 1.75,
  scale: 0.2,
  rotation: 25
};
```

---

## Version History

### v6.0 (Current) - Multiple Choice & Content Overhaul
- **18 new GMAT-style questions** with verified mathematical accuracy
- **Multiple choice format** replacing fill-in-the-blank
- **Square corner UI design** for modern appearance
- **Enhanced flashcard system** with completion screen and reset functionality
- **Comprehensive cheatsheet** with key formulas for each topic
- **Improved quiz flow** with visual answer feedback

### v5.0 - Complete Overhaul
- Complete UI redesign with Material Design 3
- New quiz flow: START button → Section selector → Questions
- Step-by-step multi-step quiz with strike system per step
- Quizlet-style flashcard interface with keyboard navigation
- Beams background adapted from reactbits.dev
- Enhanced offline support with improved service worker
- Organized cheatsheet by section
- Light/dark theme toggle

### v4.0 - Major Update
- Complete code restructuring
- Three.js animated background

### v3.0 - Initial Release
- Basic quiz, flashcard, and cheatsheet functionality
- Material Design styling
- PWA support

---

## License

This project is for educational purposes. Feel free to use and modify for personal study.

---

## Credits

- **Joe Viola** - Creator and developer
- **ChatGPT-5.2** - AI assistance
- **Gemini 3 Pro** - AI assistance
- **Claude** - AI assistance
- **reactbits.dev** - Beams background component inspiration
- **Google Fonts** - Typography (Roboto, Google Sans)
- **Three.js** - 3D graphics library
