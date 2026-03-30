// js/views/exercise-picker.js
// Opens as a modal sheet. Calls onAdd(exercise) when user picks one.

import * as API from '../api.js';
import { t } from '../app.js';

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function openExercisePicker(onAdd, context = 'plan') {
  // Remove any existing picker
  document.getElementById('exercise-picker-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'exercise-picker-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" id="exercise-picker-modal">
      <div class="modal-handle"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h2 class="modal-title" style="margin:0">${t('picker.title')}</h2>
        <button class="icon-btn" id="picker-close">✕</button>
      </div>
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input class="input" id="picker-search" placeholder="${t('picker.search')}" type="search">
      </div>
      <div class="chip-row" id="picker-chips">
        <div class="skeleton" style="height:36px;width:60px;border-radius:20px"></div>
        <div class="skeleton" style="height:36px;width:80px;border-radius:20px"></div>
        <div class="skeleton" style="height:36px;width:70px;border-radius:20px"></div>
      </div>
      <div id="picker-list">
        ${[...Array(5)].map(() => '<div class="skeleton skeleton-card"></div>').join('')}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Close on overlay tap (outside modal)
  overlay.addEventListener('click', e => { if (e.target === overlay) closePicker(); });
  document.getElementById('picker-close').addEventListener('click', closePicker);

  let allExercises = [];
  let currentBodyPart = 'all';
  let searchTerm = '';

  function closePicker() { overlay.remove(); }

  function renderList(exercises) {
    const list = document.getElementById('picker-list');
    if (!exercises.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏋️</div><div class="empty-state-text">${t('picker.error')}</div></div>`;
      return;
    }
    list.innerHTML = exercises.map(ex => `
      <div class="exercise-card" data-id="${esc(ex.exerciseId ?? ex.id)}" style="margin-bottom:8px">
        ${ex.gifUrl
          ? `<img class="exercise-thumb" src="${ex.gifUrl}" alt="${esc(ex.name)}" loading="lazy">`
          : `<div class="exercise-thumb-placeholder">🏋️</div>`}
        <div class="exercise-info">
          <div class="exercise-name">${esc(ex.name)}</div>
          <div class="exercise-meta">${esc(ex.targetMuscles?.[0] ?? ex.target ?? '')} · ${esc(ex.equipments?.[0] ?? ex.equipment ?? '')}</div>
        </div>
        <button class="btn-ghost picker-add-btn" data-id="${esc(ex.exerciseId ?? ex.id)}">+</button>
      </div>
    `).join('');

    list.querySelectorAll('.exercise-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('picker-add-btn')) return;
        const ex = exercises.find(x => (x.exerciseId ?? x.id) === card.dataset.id);
        if (ex) showExerciseDetail(ex, onAdd, closePicker, context);
      });
    });
    list.querySelectorAll('.picker-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ex = exercises.find(x => (x.exerciseId ?? x.id) === btn.dataset.id);
        if (ex) { onAdd(ex); closePicker(); }
      });
    });
  }

  function applyFilters() {
    let filtered = allExercises;
    if (currentBodyPart !== 'all') {
      filtered = filtered.filter(ex => {
        const bp = ex.bodyParts?.[0] ?? ex.bodyPart ?? '';
        return bp.toLowerCase() === currentBodyPart.toLowerCase();
      });
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(ex => ex.name.toLowerCase().includes(q));
    }
    renderList(filtered.slice(0, 80)); // cap at 80 for performance
  }

  async function loadBodyParts() {
    try {
      const parts = await API.getBodyPartList();
      const chips = document.getElementById('picker-chips');
      chips.innerHTML = ['all', ...parts].map(p => `
        <button class="chip ${p === 'all' ? 'active' : ''}" data-part="${p}">
          ${p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      `).join('');
      chips.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', async () => {
          chips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          currentBodyPart = chip.dataset.part;
          if (currentBodyPart !== 'all' && !allExercises.some(ex => {
            const bp = ex.bodyParts?.[0] ?? ex.bodyPart ?? '';
            return bp.toLowerCase() === currentBodyPart.toLowerCase();
          })) {
            // Load exercises for this body part
            document.getElementById('picker-list').innerHTML =
              [...Array(5)].map(() => '<div class="skeleton skeleton-card"></div>').join('');
            const exs = await API.getExercisesByBodyPart(currentBodyPart);
            // Merge into allExercises
            exs.forEach(ex => {
              if (!allExercises.find(e => (e.exerciseId ?? e.id) === (ex.exerciseId ?? ex.id))) {
                allExercises.push(ex);
              }
            });
          }
          applyFilters();
        });
      });
    } catch (err) {
      console.error('Failed to load body parts', err);
    }
  }

  async function initialLoad() {
    try {
      // Load 'all' exercises — use cached or fetch
      allExercises = await API.getAllExercises();
      applyFilters();
    } catch {
      document.getElementById('picker-list').innerHTML =
        `<div class="empty-state"><div class="empty-state-text">${t('picker.error')}</div></div>`;
    }
    await loadBodyParts();
  }

  document.getElementById('picker-search').addEventListener('input', e => {
    searchTerm = e.target.value.trim();
    applyFilters();
  });

  initialLoad();
}

function showExerciseDetail(ex, onAdd, closePicker, context = 'plan') {
  const existing = document.getElementById('exercise-detail-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'exercise-detail-overlay';
  overlay.className = 'modal-overlay';

  const instructions = Array.isArray(ex.instructions) ? ex.instructions : [];
  const addLabel = context === 'workout' ? t('picker.addWorkout') : t('picker.add');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-handle"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h2 class="modal-title" style="margin:0;font-size:20px">${esc(ex.name)}</h2>
        <button class="icon-btn" id="detail-close">✕</button>
      </div>
      ${ex.gifUrl ? `<img src="${ex.gifUrl}" alt="${esc(ex.name)}" style="width:100%;border-radius:12px;margin-bottom:12px">` : ''}
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <span class="badge">${esc(ex.targetMuscles?.[0] ?? ex.target ?? 'N/A')}</span>
        <span class="badge">${esc(ex.equipments?.[0] ?? ex.equipment ?? 'N/A')}</span>
        ${(ex.bodyParts?.[0] ?? ex.bodyPart) ? `<span class="badge">${esc(ex.bodyParts?.[0] ?? ex.bodyPart)}</span>` : ''}
      </div>
      ${instructions.length ? `
        <h3 style="font-family:'Barlow Condensed',sans-serif;font-size:18px;margin-bottom:8px">Instructions</h3>
        <ol style="padding-left:20px;color:var(--text2);font-size:14px;line-height:1.6">
          ${instructions.map(i => `<li style="margin-bottom:6px">${esc(i)}</li>`).join('')}
        </ol>
      ` : ''}
      <div style="margin-top:20px">
        <button class="btn btn-primary" id="detail-add">${addLabel}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('detail-close').addEventListener('click', () => overlay.remove());
  document.getElementById('detail-add').addEventListener('click', () => {
    overlay.remove();
    onAdd(ex);
    closePicker();
  });
}
