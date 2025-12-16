
(function(){
  const state = {
    view: 'cheatsheet',
    data: [],
    quiz: {
      active: false,
      queue: [],
      qIndex: 0,
      sIndex: 0,
      strikes: 0,
      filter: 'all'
    },
    flashcardIndex: 0
  };

  const main = document.getElementById('main');
  const tabs = document.querySelectorAll('.tab-btn');

  async function init(){
    try {
      const res = await fetch('data/content.json');
      state.data = (await res.json()).items;
      render();
    } catch(e) { console.error(e); }
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.view = btn.dataset.view;
      render();
    });
  });

  function render(){
    main.innerHTML = '';
    if(state.view === 'cheatsheet') renderCheatsheet();
    else if(state.view === 'flashcards') renderFlashcards();
    else if(state.view === 'quiz') renderQuiz();
  }

  // --- Cheatsheet ---
  function renderCheatsheet(){
    const list = document.createElement('div');
    list.className = 'card-list';
    state.data.forEach(item => {
      if(!item.cheatsheet) return;
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-header">
          <h3 class="item-title">${item.cheatsheet.title}</h3>
          <span class="item-tag">${item.tags[0]}</span>
        </div>
        <div class="item-body">${item.cheatsheet.body}</div>
        ${item.cheatsheet.example ? `<div class="item-example">${item.cheatsheet.example}</div>` : ''}
      `;
      list.appendChild(card);
    });
    main.appendChild(list);
  }

  // --- Flashcards ---
  function renderFlashcards(){
    const deck = state.data.filter(i => i.flashcard);
    if(!deck.length) return;
    
    // Circular bounds
    if(state.flashcardIndex >= deck.length) state.flashcardIndex = 0;
    if(state.flashcardIndex < 0) state.flashcardIndex = deck.length - 1;
    
    const item = deck[state.flashcardIndex];

    const container = document.createElement('div');
    container.innerHTML = `
      <div class="flashcard-container" id="fc-card">
        <div class="flashcard-inner">
          <div class="flashcard-face front">
            <div class="fc-label">Question</div>
            <div class="fc-text">${item.flashcard.front}</div>
          </div>
          <div class="flashcard-face back">
            <div class="fc-label">Answer</div>
            <div class="fc-text">${item.flashcard.back}</div>
          </div>
        </div>
      </div>
      <div class="fc-controls">
        <button class="circle-btn" id="fc-prev">←</button>
        <button class="circle-btn" id="fc-next">→</button>
      </div>
      <div style="text-align:center; margin-top:10px; opacity:0.6; font-size:12px;">
        ${state.flashcardIndex + 1} / ${deck.length}
      </div>
    `;
    main.appendChild(container);

    container.querySelector('#fc-card').addEventListener('click', function() {
      this.classList.toggle('flipped');
    });
    container.querySelector('#fc-prev').addEventListener('click', (e) => {
      e.stopPropagation(); state.flashcardIndex--; renderFlashcards();
    });
    container.querySelector('#fc-next').addEventListener('click', (e) => {
      e.stopPropagation(); state.flashcardIndex++; renderFlashcards();
    });
  }

  // --- Quiz ---
  function renderQuiz(){
    // 1. Start Screen
    if(!state.quiz.active){
      const menu = document.createElement('div');
      menu.className = 'quiz-menu';
      menu.innerHTML = `
        <h1 style="font-family:var(--font-brand); font-weight:500;">Ready?</h1>
        <p style="opacity:0.8; margin-bottom:30px;">Multi-step problems. 2 strikes = Restart.</p>
        
        <button class="big-start-btn" id="start-btn">START</button>
        
        <div class="quiz-filter-tabs">
          <button class="filter-btn ${state.quiz.filter==='all'?'active':''}" data-f="all">All</button>
          <button class="filter-btn ${state.quiz.filter==='quant'?'active':''}" data-f="quant">Quant</button>
          <button class="filter-btn ${state.quiz.filter==='verbal'?'active':''}" data-f="verbal">Verbal</button>
          <button class="filter-btn ${state.quiz.filter==='integrated'?'active':''}" data-f="integrated">Integrated</button>
        </div>
      `;
      main.appendChild(menu);

      menu.querySelectorAll('.filter-btn').forEach(b => {
        b.addEventListener('click', () => { state.quiz.filter = b.dataset.f; renderQuiz(); });
      });

      menu.querySelector('#start-btn').addEventListener('click', startQuiz);
      return;
    }

    // 2. Question View
    const qItem = state.quiz.queue[state.quiz.qIndex];
    if(!qItem) { finishQuiz(); return; }
    
    const step = qItem.quiz[state.quiz.sIndex];
    const totalSteps = qItem.quiz.length;
    
    // Progress calculation
    const qProg = (state.quiz.qIndex / state.quiz.queue.length);
    const sProg = (state.quiz.sIndex / totalSteps) * (1 / state.quiz.queue.length);
    const pct = (qProg + sProg) * 100;

    const wrapper = document.createElement('div');
    wrapper.className = 'quiz-container';
    wrapper.innerHTML = `
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="q-card">
        <div class="q-meta">
          <span>Question ${state.quiz.qIndex + 1} of ${state.quiz.queue.length}</span>
          <span>Step ${state.quiz.sIndex + 1} / ${totalSteps}</span>
        </div>
        <div class="q-text">${step.p}</div>
        <input type="text" class="q-input" placeholder="Type answer..." autocomplete="off">
        <div class="feedback" id="fb" style="display:none"></div>
        <div class="action-row">
          <button class="next-btn" id="submit">Check</button>
        </div>
      </div>
    `;
    main.appendChild(wrapper);

    const input = wrapper.querySelector('input');
    const btn = wrapper.querySelector('#submit');
    const fb = wrapper.querySelector('#fb');
    
    setTimeout(() => input.focus(), 50);

    const check = () => {
      const val = input.value.trim().toLowerCase().replace(/\s/g, '');
      const valRaw = input.value.trim().toLowerCase();
      
      const correctList = step.accept.map(a => a.toLowerCase().replace(/\s/g, ''));
      const isCorrect = correctList.includes(val) || step.accept.some(a => a.toLowerCase() === valRaw);

      if(isCorrect){
        fb.style.display = 'flex';
        fb.className = 'feedback success';
        fb.textContent = 'Correct!';
        state.quiz.strikes = 0;
        setTimeout(() => {
          if(state.quiz.sIndex < totalSteps - 1) {
            state.quiz.sIndex++;
            renderQuiz();
          } else {
            state.quiz.qIndex++;
            state.quiz.sIndex = 0;
            renderQuiz();
          }
        }, 800);
      } else {
        state.quiz.strikes++;
        fb.style.display = 'flex';
        fb.className = 'feedback error';
        if(state.quiz.strikes >= 2){
           fb.textContent = '2 Strikes! Restarting quiz...';
           setTimeout(startQuiz, 1500);
        } else {
           fb.textContent = 'Incorrect. Try again (1 strike left).';
        }
      }
    };

    btn.addEventListener('click', check);
    input.addEventListener('keydown', e => { if(e.key === 'Enter') check(); });
  }

  function startQuiz(){
    let pool = state.data.filter(i => i.quiz && i.quiz.length > 0);
    if(state.quiz.filter !== 'all') pool = pool.filter(i => i.section === state.quiz.filter);
    
    // Shuffle
    pool.sort(() => Math.random() - 0.5);
    
    state.quiz.queue = pool;
    state.quiz.qIndex = 0;
    state.quiz.sIndex = 0;
    state.quiz.strikes = 0;
    state.quiz.active = true;
    renderQuiz();
  }

  function finishQuiz(){
    state.quiz.active = false;
    main.innerHTML = `
      <div class="quiz-menu">
        <h1>Great Job!</h1>
        <p>You completed the set.</p>
        <button class="big-start-btn" onclick="location.reload()">Done</button>
      </div>
    `;
  }

  // Init
  init();
  
  // Theme Toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
     // For now just logs, in real app toggles classes
     console.log('Toggle Theme');
  });
})();
