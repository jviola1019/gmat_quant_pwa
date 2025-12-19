/**
 * GMAT Study PWA - Main Application
 * Version 9.0 - Context Steps + Final Question Quiz System
 *
 * DEVELOPER NOTES:
 * ================
 *
 * QUIZ STATE MANAGEMENT:
 * - state.quiz.queue: Array of generated questions (from QuestionTemplates)
 * - state.quiz.qIndex: Current question index
 * - state.quiz.attempts: Wrong attempts on CURRENT QUESTION (0, 1, or 2)
 * - state.quiz.score: Number of questions answered correctly
 *
 * QUIZ FLOW:
 * - Each question shows contextSteps as read-only reasoning context
 * - User ONLY answers the finalQuestion (not intermediate steps)
 * - Steps are displayed above the final question for guidance
 *
 * ATTEMPT LOGIC (STRICT):
 * - 1st wrong answer: Show "Incorrect", NO hint, allow retry
 * - 2nd wrong answer: IMMEDIATE quiz restart with new parameters
 * - Correct answer: Move to next question
 *
 * RESTART TRIGGERS:
 * - User gets 2 wrong attempts on any question
 * - User clicks "Reset" on end screen
 * - User quits and restarts
 *
 * PARAMETERIZED QUESTIONS:
 * - All questions generated from templates in questionTemplates.js
 * - Numbers regenerate on each attempt/restart
 * - Seeded RNG ensures reproducibility
 *
 * FLASHCARD SINGLE-CARD ENFORCEMENT:
 * - DOM is cleared and rebuilt on each navigation
 * - No CSS hiding, actual DOM removal
 * - Prevents stacked/ghost cards
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // APPLICATION STATE
  // ═══════════════════════════════════════════════════════════════

  const state = {
    view: 'cheatsheet',
    data: [],           // Static content for cheatsheet/flashcards
    quiz: {
      active: false,    // Quiz in progress
      started: false,   // Past START screen
      queue: [],        // Generated questions for this session
      qIndex: 0,        // Current question index
      attempts: 0,      // Wrong attempts on current question (resets per question)
      score: 0,         // Questions answered correctly
      selectedAnswer: null,
      filter: 'all',
      attemptNumber: 0, // Increments on each restart (for new seeds)
      baseSeed: Date.now()
    },
    flashcard: {
      index: 0,
      flipped: false,
      completed: false
    }
  };

  // DOM Elements
  const main = document.getElementById('main');
  const tabs = document.querySelectorAll('.tab-btn');

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  async function init() {
    try {
      // Load static content for cheatsheet/flashcards
      const res = await fetch('data/content.json');
      const json = await res.json();
      state.data = json.items || [];

      // Generate cheatsheet/flashcard content from templates
      if (typeof QuestionTemplates !== 'undefined') {
        const generatedContent = generateStaticContent();
        state.data = [...state.data.filter(i => !i.id.startsWith('q-') && !i.id.startsWith('p-')), ...generatedContent];
      }

      render();
      setupKeyboardHandlers();
    } catch(e) {
      console.error('Failed to load content:', e);
      main.innerHTML = '<div class="error-message">Failed to load content. Please refresh the page.</div>';
    }
  }

  /**
   * Generate static content from question templates for cheatsheet/flashcards
   */
  function generateStaticContent() {
    if (typeof QuestionTemplates === 'undefined') return [];

    const content = [];
    const seed = 12345; // Fixed seed for consistent static content

    QuestionTemplates.QUESTION_TEMPLATES.forEach((template, idx) => {
      const question = QuestionTemplates.generateQuestion(template, seed + idx);
      content.push({
        id: question.id,
        section: question.section,
        tags: question.tags,
        fullQuestion: question.fullQuestion,
        finalAnswer: String(question.finalAnswer),
        cheatsheet: question.cheatsheet,
        flashcard: question.flashcard
      });
    });

    return content;
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.view = btn.dataset.view;

      // Reset view-specific state
      if (state.view === 'quiz') {
        state.quiz.active = false;
        state.quiz.started = false;
      }
      if (state.view === 'flashcards') {
        state.flashcard.flipped = false;
      }
      render();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // KEYBOARD HANDLERS
  // ═══════════════════════════════════════════════════════════════

  function setupKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      // Flashcard controls
      if (state.view === 'flashcards' && !state.flashcard.completed) {
        if (e.key === 'ArrowLeft') {
          navigateFlashcard(-1);
        } else if (e.key === 'ArrowRight') {
          navigateFlashcard(1);
        } else if (e.key === ' ') {
          e.preventDefault();
          toggleFlashcard();
        }
      }

      // Quiz controls
      if (state.view === 'quiz' && state.quiz.active) {
        if (e.key === 'Enter' && state.quiz.selectedAnswer !== null) {
          checkAnswer();
        } else if (e.key === 'Escape') {
          if (confirm('Quit quiz?')) {
            resetQuiz();
          }
        } else if (e.key >= '1' && e.key <= '5') {
          const idx = parseInt(e.key) - 1;
          const qItem = state.quiz.queue[state.quiz.qIndex];
          if (qItem && qItem.finalChoices && qItem.finalChoices[idx]) {
            selectAnswer(idx);
          }
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER FUNCTION
  // Clears DOM completely to prevent stacking
  // ═══════════════════════════════════════════════════════════════

  function render() {
    // CRITICAL: Clear all children to prevent ghost elements
    while (main.firstChild) {
      main.removeChild(main.firstChild);
    }

    switch(state.view) {
      case 'cheatsheet':
        renderCheatsheet();
        break;
      case 'flashcards':
        renderFlashcards();
        break;
      case 'quiz':
        renderQuiz();
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CHEATSHEET VIEW
  // ═══════════════════════════════════════════════════════════════

  function renderCheatsheet() {
    const container = document.createElement('div');
    container.className = 'cheatsheet-view';

    const sections = {
      quant: { title: 'Quantitative Reasoning', items: [] },
      verbal: { title: 'Verbal Reasoning', items: [] },
      'data-insights': { title: 'Data Insights', items: [] }
    };

    state.data.forEach(item => {
      if (item.cheatsheet && sections[item.section]) {
        sections[item.section].items.push(item);
      }
    });

    Object.entries(sections).forEach(([key, section]) => {
      if (section.items.length === 0) return;

      const sectionEl = document.createElement('div');
      sectionEl.className = 'cheatsheet-section';
      sectionEl.innerHTML = `<h2 class="section-title">${section.title}</h2>`;

      const cardList = document.createElement('div');
      cardList.className = 'card-list';

      section.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';

        let stepsHtml = '';
        if (item.cheatsheet.steps && item.cheatsheet.steps.length > 0) {
          stepsHtml = `
            <div class="item-steps">
              <span class="steps-label">Step-by-Step Solution:</span>
              <ol class="steps-list">
                ${item.cheatsheet.steps.map(step => `<li>${step}</li>`).join('')}
              </ol>
            </div>
          `;
        }

        let keyFormulasHtml = '';
        if (item.cheatsheet.keyFormulas && item.cheatsheet.keyFormulas.length > 0) {
          keyFormulasHtml = `
            <div class="item-formulas">
              <span class="formulas-label">Key Formulas:</span>
              <ul class="formulas-list">
                ${item.cheatsheet.keyFormulas.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="item-header">
            <h3 class="item-title">${item.cheatsheet.title}</h3>
            <div class="tag-container">
              ${item.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
            </div>
          </div>
          ${item.fullQuestion ? `<div class="item-question"><strong>Question:</strong> ${item.fullQuestion}</div>` : ''}
          <div class="item-body">${item.cheatsheet.body}</div>
          ${stepsHtml}
          ${keyFormulasHtml}
          ${item.finalAnswer ? `<div class="item-answer"><strong>Answer:</strong> ${item.finalAnswer}</div>` : ''}
        `;
        cardList.appendChild(card);
      });

      sectionEl.appendChild(cardList);
      container.appendChild(sectionEl);
    });

    main.appendChild(container);
  }

  // ═══════════════════════════════════════════════════════════════
  // FLASHCARDS VIEW
  // CRITICAL: Only ONE card in DOM at a time
  // ═══════════════════════════════════════════════════════════════

  function renderFlashcards() {
    const deck = state.data.filter(i => i.flashcard);
    if (!deck.length) {
      main.innerHTML = '<div class="empty-state">No flashcards available.</div>';
      return;
    }

    // Handle completion state
    if (state.flashcard.completed) {
      renderFlashcardComplete(deck);
      return;
    }

    // Bounds check
    if (state.flashcard.index >= deck.length) {
      state.flashcard.completed = true;
      renderFlashcardComplete(deck);
      return;
    }
    if (state.flashcard.index < 0) state.flashcard.index = 0;

    const item = deck[state.flashcard.index];

    // Create single container - DOM already cleared in render()
    const container = document.createElement('div');
    container.className = 'flashcard-view';

    container.innerHTML = `
      <div class="flashcard-progress">
        <span class="fc-progress-text">${state.flashcard.index + 1} of ${deck.length}</span>
        <div class="fc-progress-bar">
          <div class="fc-progress-fill" style="width: ${((state.flashcard.index + 1) / deck.length) * 100}%"></div>
        </div>
      </div>

      <div class="flashcard-wrapper">
        <div class="flashcard-container ${state.flashcard.flipped ? 'flipped' : ''}" id="fc-card">
          <div class="flashcard-inner">
            <div class="flashcard-face front">
              <div class="fc-label">Question</div>
              <div class="fc-text">${item.flashcard.front}</div>
              <div class="fc-hint">Tap to flip</div>
            </div>
            <div class="flashcard-face back">
              <div class="fc-label">Answer</div>
              <div class="fc-answer">${item.flashcard.back}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="fc-controls">
        <button class="fc-nav-btn" id="fc-prev" ${state.flashcard.index === 0 ? 'disabled' : ''}>
          <span class="fc-nav-icon">&larr;</span>
          <span>Previous</span>
        </button>
        <button class="fc-nav-btn primary" id="fc-next">
          <span>${state.flashcard.index === deck.length - 1 ? 'Finish' : 'Next'}</span>
          <span class="fc-nav-icon">&rarr;</span>
        </button>
      </div>

      <div class="fc-keyboard-hint">
        Use arrow keys to navigate, Space to flip
      </div>

      <button class="fc-reset-btn" id="fc-reset">Reset Deck</button>
    `;

    main.appendChild(container);

    // Event handlers
    document.getElementById('fc-card').addEventListener('click', toggleFlashcard);
    document.getElementById('fc-prev').addEventListener('click', () => navigateFlashcard(-1));
    document.getElementById('fc-next').addEventListener('click', () => navigateFlashcard(1));
    document.getElementById('fc-reset').addEventListener('click', resetFlashcards);
  }

  function toggleFlashcard() {
    state.flashcard.flipped = !state.flashcard.flipped;
    const card = document.getElementById('fc-card');
    if (card) {
      card.classList.toggle('flipped', state.flashcard.flipped);
    }
  }

  function navigateFlashcard(direction) {
    const deck = state.data.filter(i => i.flashcard);
    const newIndex = state.flashcard.index + direction;

    if (newIndex >= 0 && newIndex <= deck.length) {
      state.flashcard.index = newIndex;
      state.flashcard.flipped = false;
      render(); // Full re-render ensures single card
    }
  }

  function resetFlashcards() {
    state.flashcard.index = 0;
    state.flashcard.flipped = false;
    state.flashcard.completed = false;
    render();
  }

  function renderFlashcardComplete(deck) {
    const container = document.createElement('div');
    container.className = 'flashcard-complete-screen';

    container.innerHTML = `
      <div class="complete-content">
        <div class="complete-icon">&#x2714;</div>
        <h2 class="complete-title">Deck Complete!</h2>
        <p class="complete-subtitle">You've reviewed all ${deck.length} flashcards.</p>
        <div class="complete-actions">
          <button class="complete-btn primary" id="fc-review">Review Again</button>
          <button class="complete-btn secondary" id="fc-shuffle">Shuffle & Review</button>
        </div>
      </div>
    `;

    main.appendChild(container);

    document.getElementById('fc-review').addEventListener('click', resetFlashcards);
    document.getElementById('fc-shuffle').addEventListener('click', () => {
      // Shuffle data for flashcards
      for (let i = state.data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.data[i], state.data[j]] = [state.data[j], state.data[i]];
      }
      resetFlashcards();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // QUIZ VIEW
  // ═══════════════════════════════════════════════════════════════

  function renderQuiz() {
    // Phase 1: START screen
    if (!state.quiz.started) {
      renderQuizStart();
      return;
    }

    // Phase 2: Section selector
    if (!state.quiz.active) {
      renderQuizSectionSelector();
      return;
    }

    // Phase 3: Check if quiz complete
    if (state.quiz.qIndex >= state.quiz.queue.length) {
      renderQuizComplete();
      return;
    }

    // Phase 4: Active question
    renderQuizQuestion();
  }

  function renderQuizStart() {
    const container = document.createElement('div');
    container.className = 'quiz-start-screen';

    container.innerHTML = `
      <div class="quiz-hero">
        <div class="quiz-logo-container">
          <svg class="quiz-logo-svg" viewBox="0 0 120 120" fill="none">
            <rect x="10" y="10" width="100" height="100" rx="16" fill="url(#grad1)" />
            <path d="M35 55L50 70L85 35" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
            <path d="M30 85H90" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
            <path d="M30 95H70" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#a8c7fa;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#7c4dff;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="quiz-title">GMAT Quiz</h1>
        <p class="quiz-subtitle">Parameterized questions with randomized numbers</p>
      </div>

      <button class="quiz-start-btn" id="quiz-start">
        <span>Start Quiz</span>
        <span class="start-btn-icon">&rarr;</span>
      </button>

      <div class="quiz-rules">
        <div class="rule-item">
          <span class="rule-icon">1</span>
          <span class="rule-text">Read the reasoning steps, then answer the final question</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">2</span>
          <span class="rule-text">First wrong: marked incorrect, try again</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">3</span>
          <span class="rule-text">Second wrong: quiz restarts with new numbers</span>
        </div>
      </div>
    `;

    main.appendChild(container);
    document.getElementById('quiz-start').addEventListener('click', () => {
      state.quiz.started = true;
      render();
    });
  }

  function renderQuizSectionSelector() {
    // Count questions per section using templates
    const counts = { all: 0, quant: 0, verbal: 0, 'data-insights': 0 };

    if (typeof QuestionTemplates !== 'undefined') {
      QuestionTemplates.QUESTION_TEMPLATES.forEach(t => {
        counts.all++;
        if (counts[t.section] !== undefined) counts[t.section]++;
      });
    }

    const container = document.createElement('div');
    container.className = 'quiz-section-selector';

    container.innerHTML = `
      <h2 class="section-selector-title">Choose a Section</h2>
      <p class="section-selector-subtitle">Questions have randomized numbers each attempt</p>

      <div class="section-tabs">
        <button class="section-tab ${state.quiz.filter === 'all' ? 'active' : ''}" data-section="all">
          <span class="section-tab-name">All</span>
          <span class="section-tab-count">${counts.all} questions</span>
        </button>
        <button class="section-tab ${state.quiz.filter === 'quant' ? 'active' : ''}" data-section="quant">
          <span class="section-tab-name">Quantitative</span>
          <span class="section-tab-count">${counts.quant} questions</span>
        </button>
      </div>

      <button class="quiz-begin-btn" id="quiz-begin">Begin Quiz</button>
      <button class="quiz-back-btn" id="quiz-back">&larr; Back</button>
    `;

    main.appendChild(container);

    container.querySelectorAll('.section-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.quiz.filter = tab.dataset.section;
      });
    });

    document.getElementById('quiz-begin').addEventListener('click', startQuiz);
    document.getElementById('quiz-back').addEventListener('click', () => {
      state.quiz.started = false;
      render();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // QUIZ QUESTION RENDERING
  // Shows context steps + final question (user only answers final)
  // ═══════════════════════════════════════════════════════════════

  function renderQuizQuestion() {
    const qItem = state.quiz.queue[state.quiz.qIndex];
    if (!qItem || !qItem.finalQuestion) {
      renderQuizComplete();
      return;
    }

    const totalQuestions = state.quiz.queue.length;
    const progressPct = ((state.quiz.qIndex + 1) / totalQuestions) * 100;

    const container = document.createElement('div');
    container.className = 'quiz-question-view';

    // Build context steps HTML (read-only, for guidance)
    let contextStepsHtml = '';
    if (qItem.contextSteps && qItem.contextSteps.length > 0) {
      contextStepsHtml = `
        <div class="quiz-context-steps">
          <div class="context-steps-header">Reasoning Steps (for guidance):</div>
          <ol class="context-steps-list">
            ${qItem.contextSteps.map((step, idx) => `
              <li class="context-step-item">
                <span class="step-text">${step.prompt}</span>
                <span class="step-answer">→ ${step.correctValue}</span>
              </li>
            `).join('')}
          </ol>
        </div>
      `;
    }

    // Build choices HTML for final question
    const choicesHtml = qItem.finalChoices.map((choice, idx) => `
      <button class="quiz-choice-btn ${state.quiz.selectedAnswer === idx ? 'selected' : ''}" data-index="${idx}">
        <span class="choice-letter">${String.fromCharCode(65 + idx)}</span>
        <span class="choice-text">${choice}</span>
      </button>
    `).join('');

    container.innerHTML = `
      <div class="quiz-header">
        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" style="width: ${progressPct}%"></div>
        </div>
        <div class="quiz-meta">
          <span>Question ${state.quiz.qIndex + 1} of ${totalQuestions}</span>
        </div>
      </div>

      <div class="quiz-card">
        <div class="quiz-final-question-header">Final Question:</div>
        <div class="quiz-question-text quiz-final-question">${qItem.finalQuestion}</div>

        ${contextStepsHtml}

        <div class="quiz-answer-section">
          <div class="answer-section-header">Your Answer:</div>
          <div class="quiz-choices" id="quiz-choices">
            ${choicesHtml}
          </div>
        </div>

        <div class="quiz-strike-indicator">
          ${state.quiz.attempts > 0 ? `<span class="strike-warning">Attempt ${state.quiz.attempts + 1} of 2 — Next wrong restarts quiz</span>` : ''}
        </div>

        <div class="quiz-feedback" id="quiz-feedback"></div>

        <button class="quiz-submit-btn" id="quiz-submit" ${state.quiz.selectedAnswer === null ? 'disabled' : ''}>
          Check Answer
        </button>
      </div>

      <button class="quiz-quit-btn" id="quiz-quit">Quit Quiz</button>
    `;

    main.appendChild(container);

    // Event handlers
    container.querySelectorAll('.quiz-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectAnswer(parseInt(btn.dataset.index));
      });
    });

    document.getElementById('quiz-submit').addEventListener('click', checkAnswer);
    document.getElementById('quiz-quit').addEventListener('click', () => {
      if (confirm('Quit quiz? Your progress will be lost.')) {
        resetQuiz();
      }
    });
  }

  function selectAnswer(idx) {
    state.quiz.selectedAnswer = idx;

    // Update UI
    document.querySelectorAll('.quiz-choice-btn').forEach(btn => {
      btn.classList.remove('selected');
      if (parseInt(btn.dataset.index) === idx) {
        btn.classList.add('selected');
      }
    });

    const submitBtn = document.getElementById('quiz-submit');
    if (submitBtn) submitBtn.disabled = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // ANSWER CHECKING - STRICT ATTEMPT LOGIC
  // 1st wrong: mark incorrect, NO hint, allow retry
  // 2nd wrong: IMMEDIATE restart
  // ═══════════════════════════════════════════════════════════════

  function checkAnswer() {
    const qItem = state.quiz.queue[state.quiz.qIndex];
    const isCorrect = state.quiz.selectedAnswer === qItem.finalAnswerIndex;

    const feedback = document.getElementById('quiz-feedback');
    const choicesContainer = document.getElementById('quiz-choices');

    // Disable all choices
    choicesContainer.querySelectorAll('.quiz-choice-btn').forEach(btn => {
      btn.disabled = true;
      const idx = parseInt(btn.dataset.index);
      if (idx === qItem.finalAnswerIndex) {
        btn.classList.add('correct');
      } else if (idx === state.quiz.selectedAnswer && !isCorrect) {
        btn.classList.add('wrong');
      }
    });

    if (isCorrect) {
      // CORRECT ANSWER
      feedback.className = 'quiz-feedback success';
      feedback.textContent = 'Correct!';
      feedback.style.display = 'block';

      document.getElementById('quiz-submit').disabled = true;

      setTimeout(() => {
        // Move to next question
        state.quiz.score++;
        state.quiz.qIndex++;
        state.quiz.selectedAnswer = null;
        state.quiz.attempts = 0;
        render();
      }, 800);
    } else {
      // WRONG ANSWER
      state.quiz.attempts++;

      if (state.quiz.attempts >= 2) {
        // 2ND WRONG - RESTART QUIZ
        feedback.className = 'quiz-feedback error restart';
        feedback.innerHTML = `
          <span class="feedback-icon">&#x2717;</span>
          <span>Two incorrect attempts — restarting quiz.</span>
          <span class="feedback-answer">Correct answer: <strong>${qItem.finalAnswer}</strong></span>
        `;
        feedback.style.display = 'block';

        document.getElementById('quiz-submit').disabled = true;

        setTimeout(() => {
          // Full restart with new parameters
          state.quiz.attemptNumber++;
          state.quiz.active = false;
          state.quiz.started = true;
          state.quiz.qIndex = 0;
          state.quiz.score = 0;
          state.quiz.attempts = 0;
          state.quiz.selectedAnswer = null;
          render();
        }, 2500);
      } else {
        // 1ST WRONG - NO HINT, allow retry
        feedback.className = 'quiz-feedback error';
        feedback.innerHTML = `
          <span class="feedback-icon">&#x2717;</span>
          <span>Incorrect. Try again.</span>
        `;
        feedback.style.display = 'block';

        // Re-enable choices for retry
        setTimeout(() => {
          state.quiz.selectedAnswer = null;
          render();
        }, 1000);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // QUIZ COMPLETION SCREEN
  // ═══════════════════════════════════════════════════════════════

  function renderQuizComplete() {
    const totalQuestions = state.quiz.queue.length;
    const score = state.quiz.score;
    const percent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    const container = document.createElement('div');
    container.className = 'quiz-complete-screen';

    container.innerHTML = `
      <div class="complete-content">
        <div class="complete-icon">${percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '📚'}</div>
        <h2 class="complete-title">${percent >= 80 ? 'Excellent!' : percent >= 50 ? 'Good Job!' : 'Keep Practicing!'}</h2>
        <p class="complete-subtitle">Quiz Complete</p>

        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-value">${score}</span>
            <span class="stat-label">Correct</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${totalQuestions}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${percent}%</span>
            <span class="stat-label">Score</span>
          </div>
        </div>

        <div class="complete-actions">
          <button class="complete-btn primary" id="quiz-restart">
            Try Again (New Numbers)
          </button>
          <button class="complete-btn secondary" id="quiz-change-section">
            Change Section
          </button>
        </div>
      </div>
    `;

    main.appendChild(container);

    document.getElementById('quiz-restart').addEventListener('click', () => {
      state.quiz.attemptNumber++;
      startQuiz();
    });

    document.getElementById('quiz-change-section').addEventListener('click', () => {
      state.quiz.active = false;
      state.quiz.started = true;
      render();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // QUIZ LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  function startQuiz() {
    if (typeof QuestionTemplates === 'undefined') {
      alert('Question templates not loaded. Please refresh.');
      return;
    }

    // Generate new questions with current attempt seed
    const questions = QuestionTemplates.generateQuizQuestions(
      state.quiz.baseSeed,
      state.quiz.attemptNumber,
      state.quiz.filter
    );

    if (questions.length === 0) {
      alert('No questions available for this section.');
      return;
    }

    state.quiz.queue = questions;
    state.quiz.qIndex = 0;
    state.quiz.score = 0;
    state.quiz.attempts = 0;
    state.quiz.selectedAnswer = null;
    state.quiz.active = true;
    render();
  }

  function resetQuiz() {
    state.quiz.active = false;
    state.quiz.started = false;
    state.quiz.qIndex = 0;
    state.quiz.score = 0;
    state.quiz.attempts = 0;
    state.quiz.selectedAnswer = null;
    render();
  }

  // ═══════════════════════════════════════════════════════════════
  // THEME TOGGLE
  // ═══════════════════════════════════════════════════════════════

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      themeToggle.textContent = document.body.classList.contains('light-theme') ? '☾' : '☀︎';
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  init();

})();
