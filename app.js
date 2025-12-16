/**
 * GMAT Study PWA - Main Application
 * Version 5.0 - Complete Overhaul
 *
 * Features:
 * - Multi-step quiz with step-by-step answering
 * - Quizlet-style flashcards with flip animation
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
      started: false,        // true after START is clicked (shows section selector)
      queue: [],
      qIndex: 0,
      sIndex: 0,
      stepStrikes: 0,        // strikes for current step only
      filter: 'all'
    },
    flashcard: {
      index: 0,
      flipped: false
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
        card.innerHTML = `
          <div class="item-header">
            <h3 class="item-title">${item.cheatsheet.title}</h3>
            <div class="tag-container">
              ${item.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
            </div>
          </div>
          <div class="item-body">${item.cheatsheet.body}</div>
          ${item.cheatsheet.example ? `<div class="item-example"><strong>Example:</strong> ${item.cheatsheet.example}</div>` : ''}
        `;
        cardList.appendChild(card);
      });

      sectionEl.appendChild(cardList);
      container.appendChild(sectionEl);
    });

    main.appendChild(container);
  }

  // ═══════════════════════════════════════════════════════════════
  // FLASHCARDS VIEW - Quizlet Style
  // ═══════════════════════════════════════════════════════════════
  function renderFlashcards() {
    const deck = state.data.filter(i => i.flashcard);
    if (!deck.length) {
      main.innerHTML = '<div class="empty-state">No flashcards available.</div>';
      return;
    }

    // Circular bounds
    if (state.flashcard.index >= deck.length) state.flashcard.index = 0;
    if (state.flashcard.index < 0) state.flashcard.index = deck.length - 1;

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
        <button class="fc-nav-btn" id="fc-prev" aria-label="Previous card">
          <span class="fc-nav-icon">‹</span>
          <span class="fc-nav-text">Previous</span>
        </button>
        <button class="fc-nav-btn" id="fc-next" aria-label="Next card">
          <span class="fc-nav-text">Next</span>
          <span class="fc-nav-icon">›</span>
        </button>
      </div>

      <div class="fc-keyboard-hint">
        Use ← → arrow keys to navigate, Space to flip
      </div>
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
      state.flashcard.index--;
      state.flashcard.flipped = false;
      renderFlashcards();
    });

    container.querySelector('#fc-next').addEventListener('click', (e) => {
      e.stopPropagation();
      state.flashcard.index++;
      state.flashcard.flipped = false;
      renderFlashcards();
    });

    // Keyboard navigation
    const handleKeydown = (e) => {
      if (state.view !== 'flashcards') {
        document.removeEventListener('keydown', handleKeydown);
        return;
      }
      if (e.key === 'ArrowLeft') {
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

  // ═══════════════════════════════════════════════════════════════
  // QUIZ VIEW - Multi-Step with Section Tabs
  // ═══════════════════════════════════════════════════════════════
  function renderQuiz() {
    // Phase 1: Initial START screen (only large button)
    if (!state.quiz.started) {
      renderQuizStart();
      return;
    }

    // Phase 2: Section selector (after START, before quiz begins)
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
        <img src="icons/new_logo.png" alt="GMAT Logo" class="quiz-logo" />
        <h1 class="quiz-title">GMAT Quiz</h1>
        <p class="quiz-subtitle">Multi-step problem solving</p>
      </div>

      <button class="quiz-start-btn" id="quiz-start">
        <span class="start-btn-text">START</span>
        <span class="start-btn-icon">→</span>
      </button>

      <div class="quiz-rules">
        <div class="rule-item">
          <span class="rule-icon">📝</span>
          <span class="rule-text">Step-by-step questions</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">⚠️</span>
          <span class="rule-text">2 wrong answers on a step = restart</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">🎯</span>
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

    // Count questions per section
    const counts = {
      all: state.data.filter(i => i.quiz && i.quiz.length > 0).length,
      quant: state.data.filter(i => i.quiz && i.quiz.length > 0 && i.section === 'quant').length,
      verbal: state.data.filter(i => i.quiz && i.quiz.length > 0 && i.section === 'verbal').length,
      integrated: state.data.filter(i => i.quiz && i.quiz.length > 0 && i.section === 'integrated').length
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
        ← Back
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

  // Quiz Phase 3: Active Question
  function renderQuizQuestion(qItem) {
    const step = qItem.quiz[state.quiz.sIndex];
    const totalSteps = qItem.quiz.length;
    const totalQuestions = state.quiz.queue.length;

    // Progress calculation
    const progressPct = ((state.quiz.qIndex + (state.quiz.sIndex / totalSteps)) / totalQuestions) * 100;

    const container = document.createElement('div');
    container.className = 'quiz-question-view';

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
              ${i < state.quiz.sIndex ? '✓' : i + 1}
            </div>
          `).join('')}
        </div>

        <div class="quiz-question-text">${step.p}</div>

        <div class="quiz-input-wrapper">
          <input
            type="text"
            class="quiz-input"
            id="quiz-answer"
            placeholder="Type your answer..."
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
          />
          <div class="quiz-strike-indicator">
            ${state.quiz.stepStrikes > 0 ? `<span class="strike-warning">${state.quiz.stepStrikes}/2 attempts</span>` : ''}
          </div>
        </div>

        <div class="quiz-feedback" id="quiz-feedback"></div>

        <button class="quiz-submit-btn" id="quiz-submit">
          Check Answer
        </button>
      </div>

      <button class="quiz-quit-btn" id="quiz-quit">
        Quit Quiz
      </button>
    `;

    main.appendChild(container);

    const input = container.querySelector('#quiz-answer');
    const submitBtn = container.querySelector('#quiz-submit');
    const feedback = container.querySelector('#quiz-feedback');

    // Focus input
    setTimeout(() => input.focus(), 100);

    // Submit handler
    const checkAnswer = () => {
      const userAnswer = input.value.trim();
      if (!userAnswer) {
        feedback.className = 'quiz-feedback error';
        feedback.textContent = 'Please enter an answer.';
        feedback.style.display = 'block';
        return;
      }

      const isCorrect = validateAnswer(userAnswer, step.accept);

      if (isCorrect) {
        // Correct answer
        feedback.className = 'quiz-feedback success';
        feedback.textContent = '✓ Correct!';
        feedback.style.display = 'block';
        state.quiz.stepStrikes = 0;

        submitBtn.disabled = true;
        input.disabled = true;

        setTimeout(() => {
          if (state.quiz.sIndex < totalSteps - 1) {
            // Next step
            state.quiz.sIndex++;
          } else {
            // Next question
            state.quiz.qIndex++;
            state.quiz.sIndex = 0;
          }
          render();
        }, 1000);
      } else {
        // Wrong answer
        state.quiz.stepStrikes++;

        if (state.quiz.stepStrikes >= 2) {
          // 2 strikes on same step = restart
          feedback.className = 'quiz-feedback error restart';
          feedback.innerHTML = `
            <span class="feedback-icon">✗</span>
            <span class="feedback-text">2 incorrect attempts. Restarting quiz...</span>
            <span class="feedback-answer">Correct answer: <strong>${step.a}</strong></span>
          `;
          feedback.style.display = 'block';

          submitBtn.disabled = true;
          input.disabled = true;

          setTimeout(() => {
            state.quiz.active = false;
            state.quiz.started = true;
            state.quiz.stepStrikes = 0;
            render();
          }, 2500);
        } else {
          // First strike
          feedback.className = 'quiz-feedback error';
          feedback.textContent = '✗ Incorrect. Try again (1 attempt left).';
          feedback.style.display = 'block';
          input.value = '';
          input.focus();
        }
      }
    };

    submitBtn.addEventListener('click', checkAnswer);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkAnswer();
    });

    // Quit handler
    container.querySelector('#quiz-quit').addEventListener('click', () => {
      if (confirm('Are you sure you want to quit the quiz?')) {
        state.quiz.active = false;
        state.quiz.started = false;
        state.quiz.stepStrikes = 0;
        render();
      }
    });
  }

  // Quiz Completion Screen
  function renderQuizComplete() {
    const container = document.createElement('div');
    container.className = 'quiz-complete-screen';

    container.innerHTML = `
      <div class="complete-content">
        <div class="complete-icon">🎉</div>
        <h2 class="complete-title">Congratulations!</h2>
        <p class="complete-subtitle">You completed all questions in this set.</p>

        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-value">${state.quiz.queue.length}</span>
            <span class="stat-label">Questions</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${state.quiz.queue.reduce((sum, q) => sum + q.quiz.length, 0)}</span>
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
    let pool = state.data.filter(i => i.quiz && i.quiz.length > 0);

    if (state.quiz.filter !== 'all') {
      pool = pool.filter(i => i.section === state.quiz.filter);
    }

    if (pool.length === 0) {
      alert('No questions available for this section.');
      return;
    }

    // Shuffle questions (Fisher-Yates algorithm for better randomization)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    state.quiz.queue = pool;
    state.quiz.qIndex = 0;
    state.quiz.sIndex = 0;
    state.quiz.stepStrikes = 0;
    state.quiz.active = true;
    render();
  }

  // Answer Validation (flexible matching)
  function validateAnswer(userAnswer, acceptedAnswers) {
    // Normalize user answer
    const normalizedUser = userAnswer.toLowerCase().replace(/\s+/g, '').replace(/[×x]/g, '*');
    const normalizedUserSpaced = userAnswer.toLowerCase().replace(/\s+/g, ' ').trim();

    for (const accepted of acceptedAnswers) {
      const normalizedAccepted = accepted.toLowerCase().replace(/\s+/g, '').replace(/[×x]/g, '*');
      const normalizedAcceptedSpaced = accepted.toLowerCase().replace(/\s+/g, ' ').trim();

      // Exact match (ignoring spaces)
      if (normalizedUser === normalizedAccepted) return true;

      // Match with spaces preserved
      if (normalizedUserSpaced === normalizedAcceptedSpaced) return true;

      // Allow common variations (e.g., 2^18 vs 2**18 vs 2 to the 18)
      const variations = [
        normalizedAccepted,
        normalizedAccepted.replace(/\^/g, '**'),
        normalizedAccepted.replace(/\*/g, '×'),
      ];

      if (variations.includes(normalizedUser)) return true;
    }

    return false;
  }

  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      themeToggle.textContent = document.body.classList.contains('light-theme') ? '☾' : '☀︎';
    });
  }

  // Initialize
  init();
})();
