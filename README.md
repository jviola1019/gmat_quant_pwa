# GMAT Study PWA

A modern, interactive Progressive Web Application for GMAT quantitative reasoning preparation. Features multi-step quizzes, Quizlet-style flashcards, and organized cheatsheets — all working offline.

**Created by Joe Viola** with AI assistance from ChatGPT-5.2, Gemini 3 Pro, and Claude.

---

## Features

### Multi-Step Quiz System
- **Step-by-step problem solving**: Questions are broken into logical steps that guide you through the reasoning process
- **Smart answer validation**: Accepts variations in spacing, capitalization, and common mathematical notations (e.g., `2^18`, `2**18`)
- **Strike system**: Get a step wrong twice, and the quiz restarts with randomized questions to ensure mastery
- **Section filtering**: Practice all questions or focus on specific categories (Quantitative, Verbal, Integrated Reasoning)

### Quizlet-Style Flashcards
- **3D flip animation**: Click or tap to reveal the answer
- **Keyboard navigation**: Use arrow keys (← →) to navigate and spacebar to flip
- **Progress tracking**: Visual progress bar shows your position in the deck
- **One card at a time**: Clean, focused interface for better retention

### Organized Cheatsheet
- **Grouped by section**: Questions organized under Quantitative, Verbal, and Integrated Reasoning
- **Concept cards**: Each card shows the concept title, explanation, and example
- **Tag system**: Quick visual identification of topic areas

### Modern UI/UX
- **Material Design 3**: Clean, dark-themed interface with smooth animations
- **Animated background**: Beautiful Three.js Beams animation adapted from reactbits.dev
- **Responsive design**: Works on desktop, tablet, and mobile devices
- **Theme toggle**: Switch between dark and light themes

### Offline-First PWA
- **Works offline**: All content cached for offline access
- **Installable**: Add to home screen on mobile or desktop
- **Fast loading**: Service worker ensures quick startup

---

## Quick Start

1. **Open the app**: Simply open `index.html` in any modern browser
2. **Choose a tab**:
   - **Cheatsheet**: Review concepts and formulas
   - **Flashcards**: Test your recall with flip cards
   - **Quiz**: Practice with multi-step problems

### Quiz Instructions
1. Click **START** on the quiz screen
2. Select a section (All, Quantitative, Verbal, or Integrated)
3. Click **Begin Quiz**
4. Answer each step — type your answer and press Enter or click Check
5. Complete all steps to move to the next question
6. **Warning**: Two wrong answers on the same step restarts the quiz!

### Flashcard Instructions
1. Click on the card to flip between question and answer
2. Use **Previous** / **Next** buttons or arrow keys to navigate
3. Press **Spacebar** to flip the card

---

## Project Structure

```
gmat_quant_pwa/
├── index.html          # Main HTML entry point
├── app.js              # Core application logic (state, views, quiz engine)
├── styles.css          # Complete styling (Material Design 3)
├── bg.js               # Three.js Beams background animation
├── sw.js               # Service Worker for offline caching
├── manifest.json       # PWA manifest for installability
├── offline.html        # Offline fallback page
├── data/
│   └── content.json    # All quiz questions, flashcards, and cheatsheet content
└── icons/
    ├── icon-192.png    # PWA icon (192x192)
    ├── icon-512.png    # PWA icon (512x512)
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
    "body": "Explanation text",
    "example": "Optional worked example"
  },
  "flashcard": {
    "front": "Question text",
    "back": "Answer (concise)"
  },
  "quiz": [
    {
      "step": 1,
      "p": "Step prompt/question",
      "accept": ["answer1", "answer2"],
      "a": "canonical_answer"
    }
  ]
}
```

### Current Questions (5 Total)

| ID | Topic | Section | Steps |
|----|-------|---------|-------|
| q-32 | Power Divisibility (k^4 ÷ 32) | Quant | 3 |
| q-digits | Digit Counting (4^x × 5^y) | Quant | 3 |
| q-range | Combined Range | Quant | 2 |
| q-linear | Linear Penalty Formula | Quant | 3 |
| q-sci | Scientific Notation % | Quant | 2 |

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
5. Include multiple accepted answers in the `accept` array for flexibility

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

### v5.0 (Current) - Complete Overhaul
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
