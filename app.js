/* =========================================================================
   app.js — Lógica da aplicação (vanilla JS, sem frameworks)
   ========================================================================= */

(function () {
  "use strict";

  /* ===================== ESTADO GLOBAL ===================== */
  const state = {
    phase: "cover", // cover | prologue | dashboard
    activeTab: "counter", // counter | reasons | letter | recados | proposal
    selectedNickname: null,
    reasonsStep: "step1", // step1 | step2 | revealed
    randomReasonIdx: null,
    letterOpen: false,
    notes: [],
    noteSelectedColor: NOTE_COLORS[1].id, // pink
    noteSelectedSticker: NOTE_STICKERS[0],
    proposalAccepted: false,
    noBtnMoved: false,
  };

  const TABS_ORDER = ["counter", "reasons", "letter", "recados", "proposal"];

  /* ===================== HELPERS ===================== */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function pad2(n) { return String(n).padStart(2, "0"); }

  function safeConfetti(opts) {
    if (typeof confetti === "function") {
      try { confetti(opts); } catch (e) { /* ignore */ }
    }
  }

  /* ===================== FUNDO: PALAVRAS CAINDO ===================== */
  function initFallingBackground() {
    const container = $("#falling-bg");
    const fragment = document.createDocumentFragment();
    const TOTAL = 110; // densidade do fundo

    for (let i = 0; i < TOTAL; i++) {
      const isHeart = Math.random() > 0.55;
      const text = isHeart
        ? FALLING_HEARTS_POOL[Math.floor(Math.random() * FALLING_HEARTS_POOL.length)]
        : FALLING_WORDS_POOL[Math.floor(Math.random() * FALLING_WORDS_POOL.length)];

      const left = (Math.random() * 98).toFixed(1) + "%";
      const delay = (Math.random() * -35).toFixed(1) + "s";
      const duration = (12 + Math.random() * 20).toFixed(1) + "s";
      const fontClass = FALLING_FONT_CLASSES[Math.floor(Math.random() * FALLING_FONT_CLASSES.length)];

      let size;
      if (isHeart) size = (1.2 + Math.random() * 1.0).toFixed(2) + "rem";
      else if (fontClass === "font-script") size = (1.4 + Math.random() * 0.9).toFixed(2) + "rem";
      else if (fontClass === "font-serif-italic") size = (1.2 + Math.random() * 0.7).toFixed(2) + "rem";
      else size = (1.0 + Math.random() * 0.6).toFixed(2) + "rem";

      const opacity = (0.35 + Math.random() * 0.45).toFixed(2);
      const rotate = Math.floor(Math.random() * 360 - 180) + "deg";
      const color = FALLING_COLORS_POOL[Math.floor(Math.random() * FALLING_COLORS_POOL.length)];

      const span = document.createElement("span");
      span.className = "falling-item " + fontClass;
      span.textContent = text;
      span.style.left = left;
      span.style.animationDelay = delay;
      span.style.animationDuration = duration;
      span.style.fontSize = size;
      span.style.opacity = opacity;
      span.style.color = color;
      span.style.setProperty("--fall-rotate", rotate);
      span.style.setProperty("--fall-opacity", opacity);

      fragment.appendChild(span);
    }
    container.appendChild(fragment);
  }

  /* ===================== NAVEGAÇÃO DE FASES ===================== */
  function setPhase(phase) {
    state.phase = phase;
    $all(".phase").forEach((el) => el.classList.remove("is-active"));
    $("#phase-" + phase).classList.add("is-active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (phase === "prologue") startTypewriter();
    if (phase === "dashboard") renderActiveTab();
  }

  /* ===================== TYPEWRITER (PRÓLOGO) ===================== */
 const PROLOGUE_TEXT =
  '"Se eu pudesse escolher um único momento para reviver infinitas vezes, escolheria o dia em que você entrou na minha vida. ' +
  'Desde então, cada sorriso seu se tornou o meu motivo para sorrir, cada abraço o meu lugar favorito e cada segundo ao seu lado o meu maior presente. ' +
  'Esta é uma pequena viagem pelas lembranças que construímos juntos, porque nenhuma palavra é capaz de descrever o tamanho do amor que sinto por você. Você é o meu lar, o meu sonho e o meu universo inteiro."';

  let typewriterTimer = null;
  let typewriterStarted = false;

  function startTypewriter() {
    if (typewriterStarted) return;
    typewriterStarted = true;

    const el = $("#typewriter-text");
    let index = 0;

    setTimeout(() => {
      typewriterTimer = setInterval(() => {
        if (index < PROLOGUE_TEXT.length) {
          index++;
          el.textContent = PROLOGUE_TEXT.slice(0, index);
        } else {
          clearInterval(typewriterTimer);
        }
      }, 35);
    }, 500);
  }

  /* ===================== ABAS DO DASHBOARD ===================== */
  function setActiveTab(tab) {
    state.activeTab = tab;
    $all(".tab-btn").forEach((btn) => btn.classList.toggle("is-active", btn.dataset.tab === tab));
    $all(".tab-panel").forEach((panel) => panel.classList.remove("is-active"));
    $("#tab-" + tab).classList.add("is-active");

    const nextWrap = $("#next-action-wrap");
    nextWrap.classList.toggle("is-hidden", tab === "proposal");

    window.scrollTo({ top: 0, behavior: "smooth" });
    renderActiveTab();
  }

  function renderActiveTab() {
    switch (state.activeTab) {
      case "counter": renderCounter(); renderNicknames(); break;
      case "reasons": renderReasons(); break;
      case "letter": renderLetter(); break;
      case "recados": renderNotes(); break;
      case "proposal": renderProposal(); break;
    }
  }

  function handleNextTab() {
    const idx = TABS_ORDER.indexOf(state.activeTab);
    if (idx < TABS_ORDER.length - 1) {
      const nextTab = TABS_ORDER[idx + 1];
      setActiveTab(nextTab);
    }
  }

  /* ===================== ABA: CONTADOR ===================== */
  let counterInterval = null;

  function calculateDiff(startDateStr) {
    const start = new Date(startDateStr);
    const now = new Date();

    let differenceMs = now.getTime() - start.getTime();
    if (differenceMs < 0) differenceMs = 0;
    const totalDays = Math.floor(differenceMs / (1000 * 60 * 60 * 24));

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += previousMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    let hours = now.getHours() - start.getHours();
    let minutes = now.getMinutes() - start.getMinutes();
    let seconds = now.getSeconds() - start.getSeconds();

    if (seconds < 0) { seconds += 60; minutes -= 1; }
    if (minutes < 0) { minutes += 60; hours -= 1; }
    if (hours < 0) hours += 24;

    return {
      years: Math.max(0, years),
      months: Math.max(0, months),
      days: Math.max(0, days),
      hours: ((hours % 24) + 24) % 24,
      minutes: ((minutes % 60) + 60) % 60,
      seconds: ((seconds % 60) + 60) % 60,
      totalDays,
    };
  }

  function renderCounter() {
    const root = $("#counter-root");
    if (!root) return;

    if (counterInterval) clearInterval(counterInterval);

    const paint = () => {
      const diff = calculateDiff(loveConfig.startDate);
      const blocks = [
        { label: diff.years === 1 ? "Ano" : "Anos", value: diff.years, cls: "" },
        { label: diff.months === 1 ? "Mês" : "Meses", value: diff.months, cls: "" },
        { label: diff.days === 1 ? "Dia" : "Dias", value: diff.days, cls: "" },
        { label: diff.hours === 1 ? "Hora" : "Horas", value: diff.hours, cls: "is-dark" },
        { label: diff.minutes === 1 ? "Minuto" : "Minutos", value: diff.minutes, cls: "is-dark" },
        { label: diff.seconds === 1 ? "Segundo" : "Segundos", value: diff.seconds, cls: "is-pulse" },
      ];

      const sinceLabel = new Date(loveConfig.startDate).toLocaleDateString("pt-BR", {
        day: "numeric", month: "long", year: "numeric",
      });

      root.innerHTML = `
        <div class="counter-wrap" id="relationship-counter">
          <div class="section-head">
            <span class="eyebrow eyebrow-rose">🕐 Cada Segundo Importa</span>
            <h3 class="section-title">Nossa Linha do Tempo Juntos</h3>
            <p class="section-sub">O relógio não para, e a felicidade de te ter ao meu lado só cresce a cada bater de ponteiros.</p>
          </div>

          <div class="time-grid">
            ${blocks.map((b) => `
              <div class="time-block">
                <div class="time-value ${b.cls}">${pad2(b.value)}</div>
                <div class="time-label">${b.label}</div>
              </div>
            `).join("")}
          </div>

          <div class="hero-ticker">
            <span class="ghost-heart ghost-heart-1">❤</span>
            <span class="ghost-heart ghost-heart-2">❤</span>
            <div class="hero-ticker-content">
              <span class="icon-heart">❤</span>
              <div class="hero-ticker-number">${diff.totalDays.toLocaleString("pt-BR")}</div>
              <div class="hero-ticker-label">Dias de puro amor, risadas e cumplicidade</div>
              <div class="hero-ticker-since">desde ${sinceLabel}</div>
            </div>
          </div>
        </div>
      `;
    };

    paint();
    counterInterval = setInterval(paint, 1000);
  }

  function renderNicknames() {
    const spotlight = $("#nickname-spotlight");
    const grid = $("#nicknames-grid");
    if (!spotlight || !grid) return;

    if (state.selectedNickname) {
      const n = state.selectedNickname;
      spotlight.innerHTML = `
        <div class="nickname-reveal">
          <span class="nickname-emoji">${n.emoji}</span>
          <h5 class="nickname-name">${n.name}</h5>
          <p class="nickname-desc">"${n.description}"</p>
        </div>
      `;
    } else {
      spotlight.innerHTML = `
        <p class="nickname-placeholder">Qual apelido combina com você agora? Toque no botão abaixo ou selecione um para ver!</p>
      `;
    }

    grid.innerHTML = loveNicknames.map((n) => `
      <div class="nickname-chip ${state.selectedNickname && state.selectedNickname.name === n.name ? "is-selected" : ""}" data-name="${encodeURIComponent(n.name)}">
        <span class="nickname-chip-emoji">${n.emoji}</span>
        <span class="nickname-chip-name">${n.name}</span>
      </div>
    `).join("");

    $all(".nickname-chip", grid).forEach((chip) => {
      chip.addEventListener("click", () => {
        const name = decodeURIComponent(chip.dataset.name);
        const nick = loveNicknames.find((n) => n.name === name);
        state.selectedNickname = nick;
        renderNicknames();
        safeConfetti({ particleCount: 15, spread: 40, colors: ["#ff0055", "#ff1493"], origin: { y: 0.85 } });
      });
    });
  }

  function pickRandomNickname() {
    const idx = Math.floor(Math.random() * loveNicknames.length);
    state.selectedNickname = loveNicknames[idx];
    renderNicknames();
    safeConfetti({ particleCount: 50, spread: 60, colors: ["#ff0055", "#ff1493", "#ff69b4", "#ffffff"], origin: { y: 0.85 } });
  }

  /* ===================== ABA: 100 MOTIVOS ===================== */
  function renderReasons() {
    const root = $("#reasons-root");
    if (!root) return;

    if (state.reasonsStep === "step1") {
      root.innerHTML = `
        <div class="reasons-wrap">
          <div class="reasons-step">
            <div class="icon-badge"><span class="icon-heart">❤</span></div>
            <h3>3 motivos pelos quais eu gosto de você:</h3>
            <p>Eu parei para refletir um pouco e coloquei em palavras o que me faz gostar tanto da sua presença.</p>
            <button id="btn-reasons-next1" class="btn btn-primary">Ver os Motivos <span class="btn-arrow">→</span></button>
          </div>
        </div>
      `;
      $("#btn-reasons-next1").addEventListener("click", () => {
        state.reasonsStep = "step2";
        renderReasons();
        safeConfetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      });
      return;
    }

    if (state.reasonsStep === "step2") {
      root.innerHTML = `
        <div class="reasons-wrap">
          <div class="reasons-step">
            <div class="icon-badge"><span style="font-size:1.5rem;">😊</span></div>
            <h3>Kakaakakakakak você achou que eu só tinha 3 motivos...</h3>
            <p>O meu amor por você não caberia em apenas três linhas. Eu tenho uma lista infinitamente maior esperando por você!</p>
            <button id="btn-reasons-next2" class="btn btn-primary">Revelar a Verdade! 💝 <span class="btn-arrow">→</span></button>
          </div>
        </div>
      `;
      $("#btn-reasons-next2").addEventListener("click", () => {
        state.reasonsStep = "revealed";
        renderReasons();
        safeConfetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      });
      return;
    }

    // revealed
    const spotlightHtml = state.randomReasonIdx !== null ? `
      <div class="reason-spotlight">
        <button class="reason-spotlight-close" id="btn-close-reason-spotlight">Fechar [x]</button>
        <span class="reason-spotlight-tag">Motivo Sorteado #${state.randomReasonIdx + 1}</span>
        <p class="reason-spotlight-text">"${loveReasons[state.randomReasonIdx]}"</p>
        <div class="reason-spotlight-foot"><span class="icon-heart">❤</span> Sempre guardado no meu coração</div>
      </div>
    ` : "";

    root.innerHTML = `
      <div class="reasons-wrap">
        <div class="reasons-revealed">
          <div class="section-head">
            <span class="eyebrow eyebrow-rose">✨ Nossa Lista Eterna</span>
            <h3 class="section-title">100 Motivos Pelos Quais Eu Te Amo</h3>
            <p class="section-sub">Cada pequeno traço do seu ser, cada momento ao seu lado se transformou em um motivo para te amar sempre mais.</p>
          </div>

          <div class="reasons-toolbar">
            <button id="btn-random-reason" class="btn btn-secondary">🔀 Sorteador de Motivos</button>
          </div>

          ${spotlightHtml}

          <div class="reasons-grid">
            ${loveReasons.map((r, i) => `
              <div class="reason-item">
                <div class="reason-num">${pad2(i + 1)}</div>
                <p class="reason-text">${r}</p>
              </div>
            `).join("")}
          </div>

          <div class="reasons-footnote">
            <span>Total de 100 motivos cheios de ternura e sincera admiração</span>
          </div>
        </div>
      </div>
    `;

    $("#btn-random-reason").addEventListener("click", () => {
      state.randomReasonIdx = Math.floor(Math.random() * loveReasons.length);
      renderReasons();
      safeConfetti({ particleCount: 30, angle: 60, spread: 55, origin: { x: 0 } });
      safeConfetti({ particleCount: 30, angle: 120, spread: 55, origin: { x: 1 } });
      requestAnimationFrame(() => {
        const spot = $(".reason-spotlight");
        if (spot) spot.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    const closeBtn = $("#btn-close-reason-spotlight");
    if (closeBtn) closeBtn.addEventListener("click", () => {
      state.randomReasonIdx = null;
      renderReasons();
    });
  }

  /* ===================== ABA: CARTA ===================== */
  function renderLetter() {
    const root = $("#letter-root");
    if (!root) return;

    root.innerHTML = `
      <div class="letter-wrap" id="love-letter">
        <div class="section-head">
          <span class="eyebrow eyebrow-pink">✉️ Uma Carta para Você</span>
          <h3 class="section-title">Minha Carta Especial</h3>
          <p class="section-sub">Clique no envelope abaixo para revelar uma mensagem sincera que escrevi do fundo do meu coração.</p>
        </div>

        <div class="letter-stage">
          <div class="envelope ${state.letterOpen ? "is-open" : ""}" id="envelope-visual">
            <div class="envelope-flap-top ${state.letterOpen ? "is-opening" : ""}"></div>
            <div class="envelope-flap-left"></div>
            <div class="envelope-flap-right"></div>
            <div class="envelope-flap-bottom"></div>
            <div class="envelope-seal">
              <div class="envelope-seal-circle"><span class="icon-heart">❤</span></div>
            </div>
            ${!state.letterOpen ? `<div class="envelope-hint"><span>👁 Clique para Abrir</span></div>` : ""}
          </div>

          <div class="letter-sheet ${state.letterOpen ? "is-visible" : ""}" id="letter-content">
            <div class="letter-divider"><span class="line"></span><span class="icon-heart">❤</span><span class="line"></span></div>
            <h4 class="letter-title">${loveConfig.letterTitle}</h4>
            <div class="letter-body">
              ${loveConfig.letterParagraphs.map((p) => `<p>${p}</p>`).join("")}
            </div>
            <div class="letter-signature">
              <span class="sig">${loveConfig.signature}</span>
              <span class="sig-sub">Para todo o sempre ❤️</span>
            </div>
            <div class="letter-close">
              <button id="btn-close-letter" class="btn-dark">Guardar na Gaveta</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const toggle = () => { state.letterOpen = !state.letterOpen; renderLetter(); };

    $("#envelope-visual").addEventListener("click", toggle);
    const closeBtn = $("#btn-close-letter");
    if (closeBtn) closeBtn.addEventListener("click", toggle);
  }

  /* ===================== ABA: MURAL DE RECADOS ===================== */
  function loadNotes() {
    try {
      const saved = localStorage.getItem("love_mural_notes");
      state.notes = saved ? JSON.parse(saved) : PRESET_NOTES.slice();
    } catch (e) {
      state.notes = PRESET_NOTES.slice();
    }
  }

  function saveNotes() {
    try { localStorage.setItem("love_mural_notes", JSON.stringify(state.notes)); } catch (e) { /* ignore */ }
  }

  function renderNotes() {
    const root = $("#notes-root");
    if (!root) return;

    if (state.notes.length === 0 && !state.notesLoaded) {
      loadNotes();
      state.notesLoaded = true;
    }

    const boardHtml = state.notes.length === 0 ? `
      <div class="notes-empty">
        <span class="pin-emoji">📌</span>
        <h5>Mural Vazio</h5>
        <p>Seja o primeiro a fixar uma mensagem linda de carinho aqui!</p>
      </div>
    ` : `
      <div class="notes-grid">
        ${state.notes.map((n) => `
          <div class="note-card" data-color="${n.color}" data-id="${n.id}" style="transform: rotate(${n.rotation || 0}deg);">
            <div class="note-pin">📌</div>
            <div class="note-sticker">${n.sticker}</div>
            <button class="note-delete" data-action="delete" data-id="${n.id}" title="Remover recado">🗑</button>
            <div class="note-content">
              <p class="note-text">&ldquo;${n.text}&rdquo;</p>
              <div class="note-meta">
                <div>
                  <span class="note-author">${n.author}</span>
                  <span class="note-date">${n.date}</span>
                </div>
                <button class="note-like-btn" data-action="like" data-id="${n.id}">
                  <span class="icon-heart">❤</span><span>${n.likes}</span>
                </button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    root.innerHTML = `
      <div class="notes-wrap" id="love-notes-mural">
        <div class="section-head">
          <span class="eyebrow eyebrow-pink">💬 Mural de Carinho</span>
          <h3 class="section-title">Nosso Mural de Recadinhos</h3>
          <p class="section-sub">Escreva um bilhete fofo, cole um sticker de coração e deixe fixado aqui para relembrarmos sempre que bater a saudade! ❤️</p>
        </div>

        <div class="notes-layout">
          <div class="notes-form-card">
            <div class="notes-form-head">
              <span class="icon-plus">+</span>
              <h4>Novo Bilhetinho</h4>
            </div>

            <form id="note-form">
              <div class="field">
                <label class="field-label">O que quer escrever? *</label>
                <textarea id="note-text" maxlength="200" rows="3" required placeholder="Escreva algo fofo aqui... (ex: Amo seu sorriso!)"></textarea>
                <span class="field-counter"><span id="note-text-count">0</span>/200 caracteres</span>
              </div>

              <div class="field">
                <label class="field-label">Assinado por:</label>
                <input type="text" id="note-author" maxlength="25" placeholder="Ex: Seu Amor, Sua Princesa..." />
              </div>

              <div class="field">
                <label class="field-label">Cor do Papel:</label>
                <div class="color-options">
                  ${NOTE_COLORS.map((c) => `<button type="button" class="color-dot ${state.noteSelectedColor === c.id ? "is-selected" : ""}" data-color="${c.id}" title="${c.label}"></button>`).join("")}
                </div>
              </div>

              <div class="field">
                <label class="field-label">Selo de Amor (Sticker):</label>
                <div class="sticker-options">
                  ${NOTE_STICKERS.map((s) => `<button type="button" class="sticker-btn ${state.noteSelectedSticker === s ? "is-selected" : ""}" data-sticker="${s}">${s}</button>`).join("")}
                </div>
              </div>

              <button type="submit" class="notes-submit">📌 Fixar no Mural</button>
            </form>
          </div>

          <div class="notes-board">
            ${boardHtml}
          </div>
        </div>
      </div>
    `;

    // Eventos: cor
    $all(".color-dot", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.noteSelectedColor = btn.dataset.color;
        renderNotes();
      });
    });

    // Eventos: sticker
    $all(".sticker-btn", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.noteSelectedSticker = btn.dataset.sticker;
        renderNotes();
      });
    });

    // Contador de caracteres
    const textarea = $("#note-text", root);
    const counter = $("#note-text-count", root);
    textarea.addEventListener("input", () => { counter.textContent = textarea.value.length; });

    // Submissão do formulário
    $("#note-form", root).addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("#note-text", root).value.trim();
      if (!text) return;
      const author = $("#note-author", root).value.trim() || "Meu Amor";

      const rotations = [1, -1, 2, -2, 3, -3];
      const rotation = rotations[Math.floor(Math.random() * rotations.length)];

      const newNote = {
        id: "note-" + Date.now(),
        text,
        author,
        color: state.noteSelectedColor,
        sticker: state.noteSelectedSticker,
        date: new Date().toLocaleDateString("pt-BR"),
        rotation,
        likes: 0,
      };

      state.notes = [newNote, ...state.notes];
      saveNotes();
      renderNotes();
    });

    // Excluir / curtir notas (delegação)
    $all('[data-action="delete"]', root).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.notes = state.notes.filter((n) => n.id !== btn.dataset.id);
        saveNotes();
        renderNotes();
      });
    });

    $all('[data-action="like"]', root).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = btn.dataset.id;
        state.notes = state.notes.map((n) => (n.id === id ? { ...n, likes: n.likes + 1 } : n));
        saveNotes();

        // Explosão de coraçãozinho local (não re-renderiza tudo para manter o efeito suave)
        const rect = btn.getBoundingClientRect();
        const burst = document.createElement("span");
        burst.className = "heart-burst";
        burst.textContent = "❤️";
        burst.style.left = (e.clientX - rect.left) + "px";
        burst.style.top = (e.clientY - rect.top) + "px";
        btn.appendChild(burst);
        setTimeout(() => burst.remove(), 800);

        const countSpan = btn.querySelector("span:last-child");
        const updated = state.notes.find((n) => n.id === id);
        if (countSpan && updated) countSpan.textContent = updated.likes;
      });
    });
  }

  /* ===================== ABA: PROPOSTA ===================== */
  function triggerProposalConfetti() {
    safeConfetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) { clearInterval(interval); return; }
      const particleCount = 50 * (timeLeft / duration);
      safeConfetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      safeConfetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  }

  function renderProposal() {
    const root = $("#proposal-root");
    if (!root) return;

    if (!state.proposalAccepted) {
      root.innerHTML = `
        <div class="proposal-wrap" id="love-surprise">
          <div class="proposal-card">
            <div class="icon-badge"><span class="icon-heart">❤</span></div>
            <h3>Uma Pergunta Especial...</h3>
            <p class="proposal-lead">Chegamos ao capítulo mais lindo da nossa jornada. Todo esse caminho nos trouxe aqui, e só consigo pensar em uma pergunta...</p>
            <div class="proposal-question">"${loveConfig.proposalQuestion}"</div>

            <div class="proposal-buttons" id="proposal-buttons">
              <button id="btn-proposal-yes" class="btn-yes">Sim! ❤️</button>
              <button id="btn-proposal-no" class="btn-no">Não 😢</button>
            </div>
          </div>
        </div>
      `;

      $("#btn-proposal-yes").addEventListener("click", () => {
        state.proposalAccepted = true;
        renderProposal();
        triggerProposalConfetti();
      });

      const noBtn = $("#btn-proposal-no");
      const wrap = $("#proposal-buttons");

      const moveNoButton = () => {
        const rect = wrap.getBoundingClientRect();
        const btnWidth = 100;
        const btnHeight = 44;
        const maxLeft = rect.width - btnWidth - 20;
        const maxTop = rect.height - btnHeight - 20;
        const randomLeft = Math.max(10, Math.floor(Math.random() * maxLeft));
        const randomTop = Math.max(10, Math.floor(Math.random() * maxTop));

        noBtn.classList.add("has-moved");
        noBtn.style.top = randomTop + "px";
        noBtn.style.left = randomLeft + "px";
      };

      noBtn.addEventListener("mouseenter", moveNoButton);
      noBtn.addEventListener("click", moveNoButton);
      noBtn.addEventListener("touchstart", (e) => { e.preventDefault(); moveNoButton(); }, { passive: false });
      return;
    }

    // accepted
    root.innerHTML = `
      <div class="proposal-wrap">
        <div class="proposal-success">
          <div class="success-icons">
            <span class="spin-icon">✨</span>
            <span class="big-heart icon-heart">❤</span>
            <span class="spin-icon">✨</span>
          </div>
          <h3>Dissemos SIM ao Amor!</h3>
          <div class="success-message">${loveConfig.proposalSuccessMessage}</div>
          <p class="success-lead">Nossos caminhos estão definitivamente selados. Obrigado por escolher caminhar comigo, fazer parte da minha vida e me dar a honra de te amar!</p>
          <div class="success-badge">🏆 História Completa & Salva no Coração</div>
          <div class="success-actions">
            <button id="btn-trigger-celebrate" class="btn-celebrate">Soltar Mais Confetes 🎉</button>
          </div>
        </div>
      </div>
    `;

    $("#btn-trigger-celebrate").addEventListener("click", triggerProposalConfetti);
  }

  /* ===================== INICIALIZAÇÃO ===================== */
  function init() {
    initFallingBackground();

    // Nomes do casal (header + footer)
    $("#brand-names").innerHTML = `${loveConfig.coupleNames.partner1} <span class="heart-sep">❤</span> ${loveConfig.coupleNames.partner2}`;
    $("#footer-names").textContent = `Para todo o sempre, ${loveConfig.coupleNames.partner1} & ${loveConfig.coupleNames.partner2}`;
    $("#footer-year").textContent = new Date().getFullYear();

    // Navegação entre fases
    $("#btn-start-experience").addEventListener("click", () => setPhase("prologue"));
    $("#btn-enter-dashboard").addEventListener("click", () => setPhase("dashboard"));

    // Abas
    $all(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
    });

    // Botão "continuar nossa história"
    $("#btn-narrative-next").addEventListener("click", handleNextTab);

    // Sorteador de apelidos (delegação simples — elemento fixo no HTML)
    $("#btn-random-nickname").addEventListener("click", pickRandomNickname);

    loadNotes();
    state.notesLoaded = true;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
