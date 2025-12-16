# GMAT Study PWA

This project is a lightweight, offline‑first study guide for the GMAT. It runs entirely in your browser and caches all assets so you can review key formulas and practice questions even without an internet connection. The app is organised into three primary study modes – *Cheatsheet*, *Flashcards* and *Quiz* – plus placeholders for future Verbal and Integrated sections.

## Features

### 📘 Cheatsheet

* A concise set of rules, patterns and worked examples for quantitative topics.  
* Each item is collapsible so you can scan quickly or dive into details.  
* Step‑by‑step explanations from all the practice problems are integrated here – no separate Notes tab to hunt through.  
* Use the search bar to filter by keyword or tag.

### 🎴 Flashcards

* A Quizlet‑style experience: one card at a time with a **Flip** button to reveal the answer.  
* Cards are shuffled on every visit. You can navigate with Prev/Next buttons or tap the card itself to flip.  
* Only the final answer and a short rationale are shown; the full derivations live in the Cheatsheet.

### 🧠 Quiz

* Multi‑step questions guide you through the problem solving process.  
* Questions are grouped by topic (e.g. exponents, factorials, radicals) and groups are shuffled each time you start the quiz so you never know what’s coming next.  
* A large **Start** button greets you; once tapped, you must answer each step in order.  
* After the first wrong attempt on a step, a hint appears. A second wrong attempt shows the explanation and automatically restarts the quiz with a fresh random order.  
* A progress bar, score and wrong count update in real‑time. Partial credit is awarded for getting the answer on the second try.  
* Section tabs at the top let you drill down to Quant or combine everything with an **All** tab.

### 🌙 Dark Mode & Futuristic UI

* Toggle light/dark themes with the sun/moon button in the header.  
* Colours and shadows are managed via CSS variables to ensure consistent theming【517566158179139†L160-L172】.  
* Panels employ subtle glass blur and gradient backgrounds for a modern feel.  
* A colourful progress bar shows your quiz progress.

### ⚙️ Extras

* Command palette (`Ctrl/⌘K`) for quick navigation and actions.  
* Search (`/`) and hotkeys to collapse/expand all items.  
* Timer for short study sprints.  
* Offline caching via Service Worker; installable on your phone or desktop.

## Running the app

1. Unzip the project and open `index.html` in a modern browser (Chrome, Edge, Firefox or Safari).  
2. Use the navigation bar to switch between Cheatsheet, Flashcards and Quiz.  
3. In **Quiz**, tap *Start* to begin. Answer each step of the problem; use the **Next** button only after you’ve selected an option. If you make two incorrect attempts on a step, the quiz will restart and reshuffle.  
4. In **Flashcards**, tap **Flip** or the card itself to see the answer; **Prev** and **Next** let you cycle through the deck.  
5. Use the **Add** button to add your own rules or cards. Custom entries are stored in localStorage and persist across sessions.

## Customising content

All study data lives in `data/content.json`. The top‑level keys are:

* `sections` – arrays of objects for the Cheatsheet and Flashcards. Each object can have an `id`, `tag`, `title`/`q`, `body`/`a` and optional `example`.  
* `quiz` – an object keyed by section name (`quant`, `verbal`, `integrated`). Each value is an array of questions. A question needs a prompt `p`, an array of `opts`, the index of the correct option `correct`, a `why` explanation and optionally a `hint`.  
* You can add your own quiz sections or cards; the UI will automatically detect new sections.

## Contributing

This project is built with plain HTML, CSS and vanilla JavaScript. There are no external dependencies, which makes it easy to extend and deploy. If you’d like to add features such as typed input questions, additional GMAT sections or improved visuals (e.g. three‑js beam effects), contributions are welcome!

---

Good luck with your GMAT prep! 🎓