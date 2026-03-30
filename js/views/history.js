// js/views/history.js

import * as DB from '../db.js';
import { navigate, t, state } from '../app.js';

export function renderHistory(container, params = {}) {
  if (params.sessionId) { renderSessionDetail(container, params.sessionId); return; }
  renderSessionList(container);
}

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function renderSessionList(container) {
  const sessions = DB.getSessions();
  const unit = state.settings.weightUnit;
  const toDisplay = kg => unit === 'lbs' ? (kg * 2.20462).toFixed(0) : kg.toFixed(0);

  container.innerHTML = `
    <div class="view">
      <h1 class="view-title">${t('history.title')}</h1>
      ${sessions.length === 0
        ? `<div class="empty-state">
             <div class="empty-state-icon">📊</div>
             <div class="empty-state-text">${t('history.empty')}</div>
           </div>`
        : sessions.map(s => `
            <div class="session-card" data-id="${s.id}">
              <div class="session-date">${new Date(s.date).toLocaleDateString(
                state.settings.language === 'sv' ? 'sv-SE' : 'en-GB',
                { weekday:'short', day:'numeric', month:'short', year:'numeric' }
              )}</div>
              <div style="font-weight:600;margin-top:2px">${s.planName}</div>
              <div class="session-meta">
                <span>⏱ ${formatDuration(s.durationSeconds)}</span>
                <span>🏋️ ${toDisplay(s.totalVolumeKg)} ${unit}</span>
                <span>${s.exercises?.length ?? 0} exercises</span>
              </div>
            </div>`).join('')
      }
    </div>
  `;

  container.querySelectorAll('.session-card').forEach(card => {
    card.addEventListener('click', () => navigate('history', { sessionId: card.dataset.id }));
  });
}

function renderSessionDetail(container, sessionId) {
  const session = DB.getSessions().find(s => s.id === sessionId);
  if (!session) { navigate('history'); return; }
  const unit = state.settings.weightUnit;
  const toDisplay = kg => unit === 'lbs' ? (kg * 2.20462).toFixed(1) : kg;

  container.innerHTML = `
    <div class="view">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <button class="btn-icon" id="back-btn">←</button>
        <h1 class="view-title" style="margin:0">${session.planName}</h1>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="session-meta" style="font-size:15px;gap:20px">
          <span>📅 ${new Date(session.date).toLocaleDateString()}</span>
          <span>⏱ ${formatDuration(session.durationSeconds)}</span>
          <span>🏋️ ${toDisplay(session.totalVolumeKg)} ${unit}</span>
        </div>
      </div>
      ${session.exercises.map(ex => `
        <div class="card" style="margin-bottom:12px">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;margin-bottom:10px">
            ${ex.name}
          </div>
          ${ex.sets.filter(s => s.done).map((s, i) => `
            <div class="set-row">
              <span class="set-num">${i + 1}</span>
              ${ex.type === 'cardio'
                ? `<span>${s.duration} min</span>`
                : ex.type === 'bodyweight'
                  ? `<span>${s.reps} reps</span>`
                  : `<span>${s.reps} × ${toDisplay(s.weight)} ${unit}</span>`
              }
              <span class="set-check done" style="margin-left:auto;pointer-events:none"></span>
            </div>`).join('')}
          <button class="btn-ghost" data-exname="${ex.name}" style="margin-top:8px;padding-left:0">
            ${t('history.viewProgress')} →
          </button>
        </div>`).join('')}
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('history'));
  container.querySelectorAll('[data-exname]').forEach(btn => {
    btn.addEventListener('click', () => navigate('progress', { exerciseName: btn.dataset.exname }));
  });
}
