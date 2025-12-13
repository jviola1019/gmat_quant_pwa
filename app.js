/* GMAT Neon Console PWA — iOS-safe, no hover/flip dependencies */
(function(){
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

  function onTap(el, fn){
    if(!el) return;
    let lock=false;
    const fire = (e)=>{
      if(lock) return;
      lock=true; setTimeout(()=>lock=false, 140);
      try{ fn(e); }catch(err){ console.error(err); }
    };
    el.addEventListener('pointerup', fire, {passive:true});
    el.addEventListener('touchend', fire, {passive:true});
    el.addEventListener('click', fire, {passive:true});
    el.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); fire(e); }
    });
  }

  const state = {
    view: 'cheatsheet',
    content: null,
    user: loadUserData(),
    search: ''
  };

  function loadUserData(){
    try{
      return JSON.parse(localStorage.getItem('gmat_pwa_user')||'') || { itemsBySection:{}, mastered:{} };
    }catch{
      return { itemsBySection:{}, mastered:{} };
    }
  }
  function saveUserData(){
    localStorage.setItem('gmat_pwa_user', JSON.stringify(state.user));
    refreshStats();
  }

  const offlinePill = $('#offlinePill');
  function updateOnline(){
    const on = navigator.onLine;
    offlinePill.textContent = on ? 'online' : 'offline';
    offlinePill.style.borderColor = on ? 'rgba(77,255,181,.35)' : 'rgba(255,92,122,.35)';
    offlinePill.style.background = on ? 'rgba(77,255,181,.10)' : 'rgba(255,92,122,.10)';
  }
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);

  async function loadContent(){
    const res = await fetch('data/content.json', {cache:'no-cache'});
    state.content = await res.json();
  }

  function getSectionItems(sectionId){
    const base = (state.content.sections.find(s=>s.id===sectionId)?.items) || [];
    const extra = (state.user.itemsBySection?.[sectionId]) || [];
    return [...base, ...extra];
  }

  const list = $('#list');
  const viewTitle = $('#viewTitle');
  const viewSubtitle = $('#viewSubtitle');
  const statCount = $('#statCount');
  const statDone = $('#statDone');

  function setView(view){
    state.view = view;
    $$('.navItem').forEach(b=> b.setAttribute('aria-current', b.dataset.view===view ? 'page' : 'false'));
    const sec = state.content.sections.find(s=>s.id===view);

    if(view === 'quiz'){
      viewTitle.textContent = 'Quiz';
      viewSubtitle.textContent = 'Tap Start, then answer like it’s test day.';
      renderQuiz();
      return;
    }
    if(view === 'notes'){
      viewTitle.textContent = 'Notes';
      viewSubtitle.textContent = 'Your scratchpad (saved locally).';
      renderNotes();
      return;
    }
    viewTitle.textContent = sec?.title || 'Study';
    viewSubtitle.textContent = sec?.subtitle || '';
    renderList();
  }

  function matchSearch(text){
    const q = (state.search||'').trim().toLowerCase();
    if(!q) return true;
    return (text||'').toLowerCase().includes(q);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function itemTemplate(item){
    const id = item.id;
    const tag = item.tag || item.type || 'item';
    const title = item.title || item.q || 'Untitled';
    const body = item.body || item.a || '';
    const example = item.example || '';
    const isMastered = !!state.user.mastered[id];

    const wrap = document.createElement('div');
    wrap.className = 'item';
    wrap.setAttribute('data-id', id);
    wrap.setAttribute('aria-expanded', 'false');

    const top = document.createElement('div');
    top.className = 'itemTop';

    const left = document.createElement('div');
    left.className = 'left';

    const t = document.createElement('p');
    t.className = 't';
    t.textContent = title;

    const s = document.createElement('p');
    s.className = 's';
    s.textContent = (item.type==='flashcard' ? 'Tap to reveal answer. ' : '') + (body || '').slice(0, 140);

    left.appendChild(t); left.appendChild(s);

    const right = document.createElement('div');
    right.style.display='flex';
    right.style.gap='8px';
    right.style.alignItems='center';

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = tag;

    const m = document.createElement('button');
    m.className = 'kbtn ' + (isMastered ? 'good' : '');
    m.type='button';
    m.textContent = isMastered ? 'Mastered' : 'Mark';

    onTap(m, (e)=>{
      e.stopPropagation();
      state.user.mastered[id] = !state.user.mastered[id];
      saveUserData();
      renderList(false);
    });

    const edit = document.createElement('button');
    edit.className = 'kbtn';
    edit.type='button';
    edit.textContent = 'Edit';

    onTap(edit, (e)=>{
      e.stopPropagation();
      openEditModal(item);
    });

    right.appendChild(badge);
    right.appendChild(m);
    right.appendChild(edit);

    top.appendChild(left);
    top.appendChild(right);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'itemBody';
    bodyEl.innerHTML = `
      <div>${escapeHtml(body).replace(/\n/g,'<br>')}</div>
      ${example ? `<div style="margin-top:10px; font-family:var(--mono); font-size:12px; color:rgba(165,174,216,.98); border-top:1px dashed rgba(255,255,255,.12); padding-top:10px;">${escapeHtml(example).replace(/\n/g,'<br>')}</div>`:''}
      <div class="actionsRow">
        <button class="kbtn" data-act="toggle">${item.type==='flashcard' ? 'Show/Hide Answer' : 'Expand/Collapse'}</button>
      </div>
    `;

    onTap(top, ()=>{
      const now = wrap.getAttribute('aria-expanded')==='true';
      wrap.setAttribute('aria-expanded', now?'false':'true');
    });

    const toggleBtn = bodyEl.querySelector('[data-act="toggle"]');
    onTap(toggleBtn, ()=>{
      const now = wrap.getAttribute('aria-expanded')==='true';
      wrap.setAttribute('aria-expanded', now?'false':'true');
    });

    wrap.appendChild(top);
    wrap.appendChild(bodyEl);
    return wrap;
  }

  function renderList(resetScroll=true){
    const items = getSectionItems(state.view);
    const filtered = items.filter(it=>{
      const blob = [it.title,it.body,it.example,it.q,it.a,it.tag,it.type].filter(Boolean).join(' ');
      return matchSearch(blob);
    });

    list.innerHTML = '';
    filtered.forEach(it=> list.appendChild(itemTemplate(it)));

    statCount.textContent = String(filtered.length);
    refreshStats(items);
    if(resetScroll) list.scrollTop = 0;
  }

  function refreshStats(allItems){
    if(!allItems){ allItems = getSectionItems(state.view); }
    let done=0;
    allItems.forEach(it=>{ if(state.user.mastered[it.id]) done++; });
    statDone.textContent = String(done);
  }

  // Quiz
  let quizIdx = 0, quizScore = 0;
  function renderQuiz(){
    const qbank = state.content.quiz || [];
    const header = document.createElement('div');
    header.className = 'item';
    header.setAttribute('aria-expanded','true');
    header.innerHTML = `
      <div class="itemTop">
        <div class="left">
          <p class="t">Quiz Mode</p>
          <p class="s">Score <span id="qScore">${quizScore}</span> • Question <span id="qNum">${qbank.length? (quizIdx+1):0}</span>/${qbank.length}</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="badge">quiz</span>
          <button class="kbtn good" id="qStart">Start</button>
          <button class="kbtn" id="qNext">Next</button>
          <button class="kbtn bad" id="qReset">Reset</button>
        </div>
      </div>
      <div class="itemBody" style="display:block">
        <div id="qPrompt" style="font-size:13px; line-height:1.45; margin-bottom:10px;">Tap Start.</div>
        <div id="qOpts" class="actionsRow" style="gap:8px;"></div>
        <div id="qWhy" class="muted" style="margin-top:10px;"></div>
      </div>
    `;
    list.innerHTML = '';
    list.appendChild(header);

    const qStart = header.querySelector('#qStart');
    const qNext = header.querySelector('#qNext');
    const qReset = header.querySelector('#qReset');
    const qPrompt = header.querySelector('#qPrompt');
    const qOpts = header.querySelector('#qOpts');
    const qWhy = header.querySelector('#qWhy');
    const qScoreEl = header.querySelector('#qScore');
    const qNumEl = header.querySelector('#qNum');

    function paint(){
      if(!qbank.length){
        qPrompt.textContent = 'No quiz questions found.';
        qOpts.innerHTML=''; qWhy.textContent='';
        return;
      }
      const q = qbank[quizIdx];
      qNumEl.textContent = String(quizIdx+1);
      qScoreEl.textContent = String(quizScore);
      qPrompt.textContent = q.p;
      qWhy.textContent = '';
      qOpts.innerHTML = '';
      q.opts.forEach((t,i)=>{
        const b = document.createElement('button');
        b.className='kbtn';
        b.type='button';
        b.textContent = '• ' + t;
        onTap(b, ()=>{
          Array.from(qOpts.querySelectorAll('button')).forEach(x=>x.disabled=true);
          if(i === q.correct){
            quizScore += 1;
            b.classList.add('good');
            qWhy.innerHTML = '✅ Correct. ' + q.why;
          }else{
            b.classList.add('bad');
            qWhy.innerHTML = '❌ Not it. ' + q.why;
            const correctBtn = qOpts.querySelectorAll('button')[q.correct];
            if(correctBtn) correctBtn.classList.add('good');
          }
          qScoreEl.textContent = String(quizScore);
        });
        qOpts.appendChild(b);
      });
    }

    onTap(qStart, ()=>{ quizIdx=0; quizScore=0; paint(); });
    onTap(qNext, ()=>{ if(!qbank.length) return; quizIdx=(quizIdx+1)%qbank.length; paint(); });
    onTap(qReset, ()=>{ quizIdx=0; quizScore=0; paint(); });

    statCount.textContent = String(qbank.length);
    statDone.textContent = String(quizScore);

    paint();
  }

  // Notes
  function renderNotes(){
    list.innerHTML = '';
    const note = localStorage.getItem('gmat_pwa_notes') || '';
    const wrap = document.createElement('div');
    wrap.className='item';
    wrap.setAttribute('aria-expanded','true');
    wrap.innerHTML = `
      <div class="itemTop">
        <div class="left">
          <p class="t">Scratchpad</p>
          <p class="s">Saved locally on this device.</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="badge">notes</span>
          <button class="kbtn good" id="nSave">Save</button>
          <button class="kbtn" id="nClear">Clear</button>
        </div>
      </div>
      <div class="itemBody" style="display:block">
        <textarea id="nText" style="width:100%; min-height: 220px;">${escapeHtml(note)}</textarea>
        <div class="muted" style="margin-top:10px;">Tip: write “If I see ___, I do ___.” That’s GMAT memory.</div>
      </div>
    `;
    list.appendChild(wrap);

    const nText = wrap.querySelector('#nText');
    onTap(wrap.querySelector('#nSave'), ()=> localStorage.setItem('gmat_pwa_notes', nText.value || ''));
    onTap(wrap.querySelector('#nClear'), ()=>{ nText.value=''; localStorage.setItem('gmat_pwa_notes',''); });

    statCount.textContent = '—';
    statDone.textContent = '—';
  }

  // Expand/collapse
  onTap($('#expandAll'), ()=> $$('.item').forEach(x=> x.setAttribute('aria-expanded','true')));
  onTap($('#collapseAll'), ()=> $$('.item').forEach(x=> x.setAttribute('aria-expanded','false')));

  // Search
  const searchInput = $('#searchInput');
  onTap($('#clearSearch'), ()=>{
    searchInput.value=''; state.search='';
    if(state.view==='quiz' || state.view==='notes') return;
    renderList();
  });
  searchInput.addEventListener('input', ()=>{
    state.search = searchInput.value || '';
    if(state.view==='quiz' || state.view==='notes') return;
    renderList(false);
  });

  // Nav
  $$('.navItem').forEach(b=> onTap(b, ()=> setView(b.dataset.view)));

  // Timer
  let t = 5*60, interval=null;
  const clock = $('#clock');
  function drawClock(){
    const m = String(Math.floor(t/60)).padStart(2,'0');
    const s = String(t%60).padStart(2,'0');
    clock.textContent = m+':'+s;
  }
  function startTimer(){
    if(interval) return;
    interval = setInterval(()=>{ if(t<=0){ clearInterval(interval); interval=null; return; } t-=1; drawClock(); }, 1000);
  }
  function pauseTimer(){ if(interval){ clearInterval(interval); interval=null; } }
  function resetTimer(){ pauseTimer(); t=5*60; drawClock(); }
  onTap($('#tStart'), startTimer);
  onTap($('#tPause'), pauseTimer);
  onTap($('#tReset'), resetTimer);

  // Export/Import
  onTap($('#exportBtn'), ()=>{
    const payload = { meta:{exportedAt:new Date().toISOString()}, user: state.user, notes: localStorage.getItem('gmat_pwa_notes')||'' };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gmat_pwa_export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
  $('#importFile').addEventListener('change', async (e)=>{
    const f = e.target.files?.[0];
    if(!f) return;
    const text = await f.text();
    try{
      const payload = JSON.parse(text);
      if(payload.user){ state.user = payload.user; saveUserData(); }
      if(typeof payload.notes === 'string'){ localStorage.setItem('gmat_pwa_notes', payload.notes); }
      setView(state.view);
      alert('Imported successfully.');
    }catch{
      alert('Import failed: invalid JSON.');
    }finally{
      e.target.value='';
    }
  });

  // Add/Edit modal (user items only)
  const editModal = $('#editModal');
  const editForm = $('#editForm');
  const editTitle = $('#editTitle');
  const deleteBtn = $('#deleteBtn');
  const fSection = $('#fSection');
  const fTag = $('#fTag');
  const fTitle = $('#fTitle');
  const fBody = $('#fBody');
  const fExample = $('#fExample');
  const fId = $('#fId');

  function isUserItem(id){
    const map = state.user.itemsBySection || {};
    return Object.values(map).some(arr => (arr||[]).some(x=>x.id===id));
  }
  function inferUserSection(id){
    const map = state.user.itemsBySection || {};
    for(const [sid, arr] of Object.entries(map)){
      if((arr||[]).some(x=>x.id===id)) return sid;
    }
    return null;
  }

  function openEditModal(item){
    editModal.setAttribute('aria-hidden','false');
    if(item && isUserItem(item.id)){
      editTitle.textContent = 'Edit item';
      fSection.value = inferUserSection(item.id) || 'cheatsheet';
      fTag.value = item.tag || '';
      fTitle.value = item.title || item.q || '';
      fBody.value = item.body || item.a || '';
      fExample.value = item.example || '';
      fId.value = item.id || '';
      deleteBtn.hidden = false;
    }else{
      editTitle.textContent = 'Add item';
      fSection.value = (['cheatsheet','patterns','flashcards'].includes(state.view) ? state.view : 'cheatsheet');
      fTag.value = '';
      fTitle.value = '';
      fBody.value = '';
      fExample.value = '';
      fId.value = '';
      deleteBtn.hidden = true;
    }
    setTimeout(()=>fTitle.focus(), 50);
  }
  function closeEdit(){ editModal.setAttribute('aria-hidden','true'); }
  onTap($('#editClose'), closeEdit);
  onTap($('#addBtn'), ()=> openEditModal(null));

  editForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const section = fSection.value;
    const tag = (fTag.value||'').trim();
    const title = (fTitle.value||'').trim();
    const body = (fBody.value||'').trim();
    const example = (fExample.value||'').trim();
    const existingId = (fId.value||'').trim();

    const id = existingId || ('u_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7));
    const type = (section === 'flashcards') ? 'flashcard' : (section === 'patterns' ? 'pattern' : 'rule');
    const item = (type==='flashcard') ? { id, type, tag, q:title, a:body, example } : { id, type, tag, title, body, example };

    const map = state.user.itemsBySection || {};
    map[section] = map[section] || [];
    const idx = map[section].findIndex(x=>x.id===id);
    if(idx>=0) map[section][idx] = item;
    else map[section].unshift(item);
    state.user.itemsBySection = map;

    saveUserData();
    closeEdit();
    if(state.view === section) renderList();
  });

  onTap(deleteBtn, ()=>{
    const id = (fId.value||'').trim();
    const section = fSection.value;
    if(!id) return;
    const map = state.user.itemsBySection || {};
    map[section] = (map[section] || []).filter(x=>x.id!==id);
    delete state.user.mastered[id];
    state.user.itemsBySection = map;
    saveUserData();
    closeEdit();
    if(state.view === section) renderList();
  });

  // Command palette
  const cmdModal = $('#cmdModal');
  const cmdInput = $('#cmdInput');
  const cmdList = $('#cmdList');
  function openCmd(){
    cmdModal.setAttribute('aria-hidden','false');
    cmdInput.value='';
    renderCmd('');
    setTimeout(()=>cmdInput.focus(), 30);
  }
  function closeCmd(){ cmdModal.setAttribute('aria-hidden','true'); }
  onTap($('#cmdBtn'), openCmd);
  onTap($('#cmdClose'), closeCmd);

  const commands = [
    { label:'Go: Cheatsheet', desc:'Open the cheatsheet view', act:()=>setView('cheatsheet') },
    { label:'Go: Patterns', desc:'Open patterns view', act:()=>setView('patterns') },
    { label:'Go: Flashcards', desc:'Open flashcards view', act:()=>setView('flashcards') },
    { label:'Go: Quiz', desc:'Open quiz mode', act:()=>setView('quiz') },
    { label:'Go: Notes', desc:'Open scratchpad notes', act:()=>setView('notes') },
    { label:'Add new item', desc:'Create a new card', act:()=>openEditModal(null) },
    { label:'Export data', desc:'Download your local items + notes', act:()=>$('#exportBtn').click() },
    { label:'Collapse all', desc:'Collapse the current list', act:()=>$('#collapseAll').click() },
    { label:'Expand all', desc:'Expand the current list', act:()=>$('#expandAll').click() },
    { label:'Timer: Reset', desc:'Reset study sprint timer', act:()=>$('#tReset').click() }
  ];

  cmdInput.addEventListener('input', ()=> renderCmd(cmdInput.value||''));
  function renderCmd(q){
    const s = (q||'').toLowerCase().trim();
    const matches = commands.filter(c => !s || (c.label+' '+c.desc).toLowerCase().includes(s));
    cmdList.innerHTML='';
    matches.slice(0,10).forEach(c=>{
      const d = document.createElement('div');
      d.className='cmd';
      d.innerHTML = `<div class="c1">${escapeHtml(c.label)}</div><div class="c2">${escapeHtml(c.desc)}</div>`;
      onTap(d, ()=>{ closeCmd(); c.act(); });
      cmdList.appendChild(d);
    });
  }

  // Install prompt (Chrome/Edge)
  let deferredPrompt = null;
  const installBtn = $('#installBtn');
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; installBtn.hidden=false; });
  onTap(installBtn, async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null;
    installBtn.hidden=true;
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    const k = e.key.toLowerCase();
    if(e.key==='/' && document.activeElement !== $('#searchInput')){ e.preventDefault(); $('#searchInput').focus(); }
    if((e.ctrlKey || e.metaKey) && k==='k'){ e.preventDefault(); openCmd(); }
    if(!e.ctrlKey && !e.metaKey && k==='n'){ openEditModal(null); }
    if(k==='escape'){ closeCmd(); closeEdit(); }
  });

  // Service worker
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js').catch(()=>{}));
  }

  (async function init(){
    updateOnline();
    drawClock();
    await loadContent();
    setView('cheatsheet');
  })();
})();