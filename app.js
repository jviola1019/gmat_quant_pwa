/**
 * GMAT Study PWA - Main Application
 * Version 6.0 - Multiple Choice Quiz System
 *
 * Features:
 * - Multiple choice quiz with step-by-step answering
 * - Quizlet-style flashcards with flip animation and reset
 * - Organized cheatsheet by category
 * - 2 strikes on same step = quiz restart
 */

(function() {
  'use strict';

  // Application State
  const state = {
    view: 'cheatsheet',
    data: [],
    quiz: {
      active: false,
      started: false,
      queue: [],
      qIndex: 0,
      sIndex: 0,
      stepStrikes: 0,
      filter: 'all',
      selectedAnswer: null
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

  // Initialize Application
  async function init() {
    try {
      const res = await fetch('data/content.json');
      const json = await res.json();
      state.data = json.items || [];
      render();
    } catch(e) {
      console.error('Failed to load content:', e);
      main.innerHTML = '<div class="error-message">Failed to load content. Please refresh the page.</div>';
    }
  }

  // Tab Navigation
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.view = btn.dataset.view;
      // Reset states when switching tabs
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

  // Main Render Function
  function render() {
    main.innerHTML = '';
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

    // Group items by section
    const sections = {
      quant: { title: 'Quantitative Reasoning', items: [] },
      verbal: { title: 'Verbal Reasoning', items: [] },
      integrated: { title: 'Integrated Reasoning', items: [] }
    };

    state.data.forEach(item => {
      if (item.cheatsheet && sections[item.section]) {
        sections[item.section].items.push(item);
      }
    });

    // Render each section
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
          <div class="item-body">${item.cheatsheet.body}</div>
          ${item.cheatsheet.example ? `<div class="item-example"><strong>Example:</strong> ${item.cheatsheet.example}</div>` : ''}
          ${keyFormulasHtml}
        `;
        cardList.appendChild(card);
      });

      sectionEl.appendChild(cardList);
      container.appendChild(sectionEl);
    });

    main.appendChild(container);
  }

  // ═══════════════════════════════════════════════════════════════
  // FLASHCARDS VIEW - Quizlet Style with Reset
  // ═══════════════════════════════════════════════════════════════
  function renderFlashcards() {
    const deck = state.data.filter(i => i.flashcard);
    if (!deck.length) {
      main.innerHTML = '<div class="empty-state">No flashcards available.</div>';
      return;
    }

    // Check if completed all cards
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
        <button class="fc-nav-btn" id="fc-prev" ${state.flashcard.index === 0 ? 'disabled' : ''} aria-label="Previous card">
          <span class="fc-nav-icon">&lt;</span>
          <span class="fc-nav-text">Previous</span>
        </button>
        <button class="fc-nav-btn primary" id="fc-next" aria-label="Next card">
          <span class="fc-nav-text">${state.flashcard.index === deck.length - 1 ? 'Finish' : 'Next'}</span>
          <span class="fc-nav-icon">&gt;</span>
        </button>
      </div>

      <div class="fc-keyboard-hint">
        Use arrow keys to navigate, Space to flip
      </div>

      <button class="fc-reset-btn" id="fc-reset">
        Reset Deck
      </button>
    `;

    main.appendChild(container);

    // Card flip handler
    const fcCard = container.querySelector('#fc-card');
    fcCard.addEventListener('click', () => {
      state.flashcard.flipped = !state.flashcard.flipped;
      fcCard.classList.toggle('flipped', state.flashcard.flipped);
    });

    // Navigation handlers
    container.querySelector('#fc-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.flashcard.index > 0) {
        state.flashcard.index--;
        state.flashcard.flipped = false;
        renderFlashcards();
      }
    });

    container.querySelector('#fc-next').addEventListener('click', (e) => {
      e.stopPropagation();
      state.flashcard.index++;
      state.flashcard.flipped = false;
      renderFlashcards();
    });

    // Reset handler
    container.querySelector('#fc-reset').addEventListener('click', () => {
      state.flashcard.index = 0;
      state.flashcard.flipped = false;
      state.flashcard.completed = false;
      renderFlashcards();
    });

    // Keyboard navigation
    const handleKeydown = (e) => {
      if (state.view !== 'flashcards') {
        document.removeEventListener('keydown', handleKeydown);
        return;
      }
      if (e.key === 'ArrowLeft' && state.flashcard.index > 0) {
        state.flashcard.index--;
        state.flashcard.flipped = false;
        renderFlashcards();
      } else if (e.key === 'ArrowRight') {
        state.flashcard.index++;
        state.flashcard.flipped = false;
        renderFlashcards();
      } else if (e.key === ' ') {
        e.preventDefault();
        state.flashcard.flipped = !state.flashcard.flipped;
        fcCard.classList.toggle('flipped', state.flashcard.flipped);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  }

  // Flashcard Completion Screen
  function renderFlashcardComplete(deck) {
    const container = document.createElement('div');
    container.className = 'flashcard-complete-screen';

    container.innerHTML = `
      <div class="complete-content">
        <div class="complete-icon">&#x2714;</div>
        <h2 class="complete-title">Deck Complete!</h2>
        <p class="complete-subtitle">You've reviewed all ${deck.length} flashcards.</p>

        <div class="complete-actions">
          <button class="complete-btn primary" id="fc-restart">
            Review Again
          </button>
          <button class="complete-btn secondary" id="fc-shuffle">
            Shuffle & Review
          </button>
        </div>
      </div>
    `;

    main.appendChild(container);

    container.querySelector('#fc-restart').addEventListener('click', () => {
      state.flashcard.index = 0;
      state.flashcard.flipped = false;
      state.flashcard.completed = false;
      renderFlashcards();
    });

    container.querySelector('#fc-shuffle').addEventListener('click', () => {
      // Shuffle the flashcard order by shuffling data
      for (let i = state.data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.data[i], state.data[j]] = [state.data[j], state.data[i]];
      }
      state.flashcard.index = 0;
      state.flashcard.flipped = false;
      state.flashcard.completed = false;
      renderFlashcards();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // QUIZ VIEW - Multiple Choice with Section Tabs
  // ═══════════════════════════════════════════════════════════════
  function renderQuiz() {
    // Phase 1: Initial START screen
    if (!state.quiz.started) {
      renderQuizStart();
      return;
    }

    // Phase 2: Section selector
    if (!state.quiz.active) {
      renderQuizSectionSelector();
      return;
    }

    // Phase 3: Active quiz question
    const qItem = state.quiz.queue[state.quiz.qIndex];
    if (!qItem) {
      renderQuizComplete();
      return;
    }

    renderQuizQuestion(qItem);
  }

  // Quiz Phase 1: START Screen
  function renderQuizStart() {
    const container = document.createElement('div');
    container.className = 'quiz-start-screen';

    container.innerHTML = `
      <div class="quiz-hero">
        <div class="quiz-logo-container">
          <svg class="quiz-logo-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <p class="quiz-subtitle">Multiple choice problem solving</p>
      </div>

      <button class="quiz-start-btn" id="quiz-start">
        <span class="start-btn-text">START</span>
        <span class="start-btn-icon">&rarr;</span>
      </button>

      <div class="quiz-rules">
        <div class="rule-item">
          <span class="rule-icon">&#x1F4DD;</span>
          <span class="rule-text">Step-by-step multiple choice</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">&#x26A0;</span>
          <span class="rule-text">2 wrong answers on a step = restart</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">&#x1F3AF;</span>
          <span class="rule-text">Complete all steps to finish</span>
        </div>
      </div>
    `;

    main.appendChild(container);

    container.querySelector('#quiz-start').addEventListener('click', () => {
      state.quiz.started = true;
      render();
    });
  }

  // Quiz Phase 2: Section Selector
  function renderQuizSectionSelector() {
    const container = document.createElement('div');
    container.className = 'quiz-section-selector';

    // Count questions per section (check for quiz.steps)
    const counts = {
      all: state.data.filter(i => i.quiz && i.quiz.steps && i.quiz.steps.length > 0).length,
      quant: state.data.filter(i => i.quiz && i.quiz.steps && i.quiz.steps.length > 0 && i.section === 'quant').length,
      verbal: state.data.filter(i => i.quiz && i.quiz.steps && i.quiz.steps.length > 0 && i.section === 'verbal').length,
      integrated: state.data.filter(i => i.quiz && i.quiz.steps && i.quiz.steps.length > 0 && i.section === 'integrated').length
    };

    container.innerHTML = `
      <h2 class="section-selector-title">Choose a Section</h2>
      <p class="section-selector-subtitle">Select the question category you want to practice</p>

      <div class="section-tabs">
        <button class="section-tab ${state.quiz.filter === 'all' ? 'active' : ''}" data-section="all">
          <span class="section-tab-name">All</span>
          <span class="section-tab-count">${counts.all} questions</span>
        </button>
        <button class="section-tab ${state.quiz.filter === 'quant' ? 'active' : ''}" data-section="quant">
          <span class="section-tab-name">Quantitative</span>
          <span class="section-tab-count">${counts.quant} questions</span>
        </button>
        <button class="section-tab ${state.quiz.filter === 'verbal' ? 'active' : ''}" data-section="verbal">
          <span class="section-tab-name">Verbal</span>
          <span class="section-tab-count">${counts.verbal} questions</span>
        </button>
        <button class="section-tab ${state.quiz.filter === 'integrated' ? 'active' : ''}" data-section="integrated">
          <span class="section-tab-name">Integrated</span>
          <span class="section-tab-count">${counts.integrated} questions</span>
        </button>
      </div>

      <button class="quiz-begin-btn" id="quiz-begin">
        Begin Quiz
      </button>

      <button class="quiz-back-btn" id="quiz-back">
        &larr; Back
      </button>
    `;

    main.appendChild(container);

    // Section tab handlers
    container.querySelectorAll('.section-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.quiz.filter = tab.dataset.section;
      });
    });

    // Begin quiz handler
    container.querySelector('#quiz-begin').addEventListener('click', startQuiz);

    // Back button handler
    container.querySelector('#quiz-back').addEventListener('click', () => {
      state.quiz.started = false;
      render();
    });
  }

  // Quiz Phase 3: Active Question (Multiple Choice)
  function renderQuizQuestion(qItem) {
    const step = qItem.quiz.steps[state.quiz.sIndex];
    const totalSteps = qItem.quiz.steps.length;
    const totalQuestions = state.quiz.queue.length;

    // Progress calculation
    const progressPct = ((state.quiz.qIndex + (state.quiz.sIndex / totalSteps)) / totalQuestions) * 100;

    const container = document.createElement('div');
    container.className = 'quiz-question-view';

    // Generate choice buttons
    const choicesHtml = step.choices.map((choice, idx) => `
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
          <span class="quiz-question-num">Question ${state.quiz.qIndex + 1} of ${totalQuestions}</span>
          <span class="quiz-step-num">Step ${state.quiz.sIndex + 1} of ${totalSteps}</span>
        </div>
      </div>

      <div class="quiz-card">
        <div class="quiz-step-indicator">
          ${Array.from({ length: totalSteps }, (_, i) => `
            <div class="step-dot ${i < state.quiz.sIndex ? 'completed' : i === state.quiz.sIndex ? 'active' : ''}">
              ${i < state.quiz.sIndex ? '&#x2713;' : i + 1}
            </div>
          `).join('')}
        </div>

        <div class="quiz-question-text">${step.prompt}</div>

        <div class="quiz-choices" id="quiz-choices">
          ${choicesHtml}
        </div>

        <div class="quiz-strike-indicator">
          ${state.quiz.stepStrikes > 0 ? `<span class="strike-warning">${state.quiz.stepStrikes}/2 attempts</span>` : ''}
        </div>

        <div class="quiz-feedback" id="quiz-feedback"></div>

        <button class="quiz-submit-btn" id="quiz-submit" ${state.quiz.selectedAnswer === null ? 'disabled' : ''}>
          Check Answer
        </button>
      </div>

      <button class="quiz-quit-btn" id="quiz-quit">
        Quit Quiz
      </button>
    `;

    main.appendChild(container);

    const choicesContainer = container.querySelector('#quiz-choices');
    const submitBtn = container.querySelector('#quiz-submit');
    const feedback = container.querySelector('#quiz-feedback');

    // Choice selection handlers
    choicesContainer.querySelectorAll('.quiz-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove selected from all
        choicesContainer.querySelectorAll('.quiz-choice-btn').forEach(b => b.classList.remove('selected'));
        // Add selected to clicked
        btn.classList.add('selected');
        state.quiz.selectedAnswer = parseInt(btn.dataset.index);
        submitBtn.disabled = false;
      });
    });

    // Submit handler
    const checkAnswer = () => {
      if (state.quiz.selectedAnswer === null) {
        feedback.className = 'quiz-feedback error';
        feedback.textContent = 'Please select an answer.';
        feedback.style.display = 'block';
        return;
      }

      const isCorrect = state.quiz.selectedAnswer === step.answerIndex;

      // Disable all choice buttons
      choicesContainer.querySelectorAll('.quiz-choice-btn').forEach(btn => {
        btn.disabled = true;
        const idx = parseInt(btn.dataset.index);
        if (idx === step.answerIndex) {
          btn.classList.add('correct');
        } else if (idx === state.quiz.selectedAnswer && !isCorrect) {
          btn.classList.add('wrong');
        }
      });

      if (isCorrect) {
        // Correct answer
        feedback.className = 'quiz-feedback success';
        feedback.textContent = 'Correct!';
        feedback.style.display = 'block';
        state.quiz.stepStrikes = 0;

        submitBtn.disabled = true;

        setTimeout(() => {
          state.quiz.selectedAnswer = null;
          if (state.quiz.sIndex < totalSteps - 1) {
            // Next step
            state.quiz.sIndex++;
          } else {
            // Next question
            state.quiz.qIndex++;
            state.quiz.sIndex = 0;
          }
          render();
        }, 1200);
      } else {
        // Wrong answer
        state.quiz.stepStrikes++;

        if (state.quiz.stepStrikes >= 2) {
          // 2 strikes on same step = restart
          feedback.className = 'quiz-feedback error restart';
          feedback.innerHTML = `
            <span class="feedback-icon">&#x2717;</span>
            <span class="feedback-text">2 incorrect attempts. Restarting quiz...</span>
            <span class="feedback-answer">Correct answer: <strong>${step.choices[step.answerIndex]}</strong></span>
          `;
          feedback.style.display = 'block';

          submitBtn.disabled = true;

          setTimeout(() => {
            state.quiz.active = false;
            state.quiz.started = true;
            state.quiz.stepStrikes = 0;
            state.quiz.selectedAnswer = null;
            render();
          }, 2500);
        } else {
          // First strike - allow retry
          feedback.className = 'quiz-feedback error';
          feedback.textContent = 'Incorrect. Try again (1 attempt left).';
          feedback.style.display = 'block';

          // Re-enable choices for retry
          setTimeout(() => {
            state.quiz.selectedAnswer = null;
            choicesContainer.querySelectorAll('.quiz-choice-btn').forEach(btn => {
              btn.disabled = false;
              btn.classList.remove('selected', 'wrong');
              // Keep correct answer hidden until they get it right or fail twice
              btn.classList.remove('correct');
            });
            submitBtn.disabled = true;
            feedback.style.display = 'none';
          }, 1500);
        }
      }
    };

    submitBtn.addEventListener('click', checkAnswer);

    // Quit handler
    container.querySelector('#quiz-quit').addEventListener('click', () => {
      if (confirm('Are you sure you want to quit the quiz?')) {
        state.quiz.active = false;
        state.quiz.started = false;
        state.quiz.stepStrikes = 0;
        state.quiz.selectedAnswer = null;
        render();
      }
    });
  }

  // Quiz Completion Screen
  function renderQuizComplete() {
    const container = document.createElement('div');
    container.className = 'quiz-complete-screen';

    const totalSteps = state.quiz.queue.reduce((sum, q) => sum + (q.quiz.steps ? q.quiz.steps.length : 0), 0);

    container.innerHTML = `
      <div class="complete-content">
        <div class="complete-icon">&#x1F389;</div>
        <h2 class="complete-title">Congratulations!</h2>
        <p class="complete-subtitle">You completed all questions in this set.</p>

        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-value">${state.quiz.queue.length}</span>
            <span class="stat-label">Questions</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${totalSteps}</span>
            <span class="stat-label">Steps Completed</span>
          </div>
        </div>

        <div class="complete-actions">
          <button class="complete-btn primary" id="restart-quiz">
            Try Again
          </button>
          <button class="complete-btn secondary" id="back-to-start">
            Choose Different Section
          </button>
        </div>
      </div>
    `;

    main.appendChild(container);

    container.querySelector('#restart-quiz').addEventListener('click', () => {
      startQuiz();
    });

    container.querySelector('#back-to-start').addEventListener('click', () => {
      state.quiz.active = false;
      state.quiz.started = true;
      render();
    });
  }

  // Start Quiz Function
  function startQuiz() {
    let pool = state.data.filter(i => i.quiz && i.quiz.steps && i.quiz.steps.length > 0);

    if (state.quiz.filter !== 'all') {
      pool = pool.filter(i => i.section === state.quiz.filter);
    }

    if (pool.length === 0) {
      alert('No questions available for this section.');
      return;
    }

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    state.quiz.queue = pool;
    state.quiz.qIndex = 0;
    state.quiz.sIndex = 0;
    state.quiz.stepStrikes = 0;
    state.quiz.selectedAnswer = null;
    state.quiz.active = true;
    render();
  }

  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      themeToggle.textContent = document.body.classList.contains('light-theme') ? '\u263E' : '\u2600\uFE0E';
    });
  }

  // Initialize
  init();
})();
