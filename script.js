(() => {
  "use strict";

  const KEY = "runCardLaad.v1";
  const SUITS = ["hukum", "paan", "chidi", "eent"];

  const defaults = {
    runs: { hukum: 0, paan: 0, chidi: 0, eent: 0 },
    players: [],
    theme: "dark",
    game: false,
  };

  // ---------- state ----------
  let state = load();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && saved.runs && Array.isArray(saved.players)) return { ...defaults, ...saved };
    } catch (e) { /* ignore broken or blocked storage */ }
    return structuredClone(defaults);
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  // ---------- elements ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const totalEl = $("#totalRuns");
  const listEl = $("#playerList");
  const emptyEl = $("#emptyMsg");
  const nameInput = $("#playerName");
  const themeBtn = $("#themeBtn");
  const gameBtn = $("#gameBtn");

  function esc(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function pop(el) {
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  }

  // ---------- run counter ----------
  function renderRuns(changed) {
    SUITS.forEach((s) => {
      const el = $(`.suit[data-suit="${s}"] .suit-count`);
      el.textContent = state.runs[s];
      if (s === changed) pop(el);
    });
    const total = SUITS.reduce((sum, s) => sum + state.runs[s], 0);
    totalEl.textContent = total;
    if (changed) pop(totalEl);
  }

  document.querySelectorAll(".suit").forEach((card) => {
    card.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const s = card.dataset.suit;
      const step = btn.dataset.act === "inc" ? 1 : -1;
      state.runs[s] = Math.max(0, state.runs[s] + step);
      renderRuns(s);
      save();
    });
  });

  $("#resetRuns").addEventListener("click", () => {
    SUITS.forEach((s) => (state.runs[s] = 0));
    renderRuns();
    save();
  });

  // ---------- laad tracker ----------
  function renderPlayers(changedIndex) {
    listEl.innerHTML = state.players
      .map(
        (p, i) => `
      <div class="player" data-i="${i}">
        <div class="idx">${i + 1}</div>
        <div class="pname">${esc(p.name)}</div>
        <div class="laad">
          <button class="btn minus" data-act="dec" aria-label="Decrease laad for ${esc(p.name)}">−</button>
          <div class="val">${p.laad}</div>
          <button class="btn plus" data-act="inc" aria-label="Increase laad for ${esc(p.name)}">+</button>
        </div>
        <div class="actions">
          <button class="btn reset" data-act="reset">↻ Reset</button>
          <button class="btn remove" data-act="remove">🗑 Remove</button>
        </div>
      </div>`
      )
      .join("");
    emptyEl.hidden = state.players.length > 0;
    if (changedIndex != null) {
      const v = listEl.querySelector(`.player[data-i="${changedIndex}"] .val`);
      if (v) pop(v);
    }
  }

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const i = Number(btn.closest(".player").dataset.i);
    const p = state.players[i];
    switch (btn.dataset.act) {
      case "inc": p.laad += 1; break;
      case "dec": p.laad = Math.max(0, p.laad - 1); break;
      case "reset": p.laad = 0; break;
      case "remove": state.players.splice(i, 1); renderPlayers(); save(); return;
    }
    renderPlayers(i);
    save();
  });

  $("#addForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    state.players.push({ name, laad: 0 });
    nameInput.value = "";
    renderPlayers();
    save();
  });

  $("#resetLaad").addEventListener("click", () => {
    state.players.forEach((p) => (p.laad = 0));
    renderPlayers();
    save();
  });

  $("#removeAll").addEventListener("click", () => {
    if (state.players.length && !confirm("Remove all players?")) return;
    state.players = [];
    renderPlayers();
    save();
  });

  // ---------- theme + game mode ----------
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    themeBtn.textContent = state.theme === "dark" ? "☀" : "🌙";
  }
  function applyGame() {
    document.body.classList.toggle("game", state.game);
    gameBtn.setAttribute("aria-pressed", String(state.game));
  }

  themeBtn.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    save();
  });
  gameBtn.addEventListener("click", () => {
    state.game = !state.game;
    applyGame();
    save();
  });

  // ---------- start ----------
  applyTheme();
  applyGame();
  renderRuns();
  renderPlayers();
})();
