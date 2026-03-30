// js/views/workout.js — Live workout session

import * as DB from '../db.js';
import { navigate, t, state } from '../app.js';
import { renderNav } from '../components/nav.js';
import { startRestTimer, stopRestTimer } from '../components/rest-timer.js';
import { openExercisePicker } from './exercise-picker.js';

let elapsedInterval = null;

export function renderWorkout(container, params = {}) {
  let session = DB.getActiveSession();

  if (!session) {
    // Build session from plan
    const plan = DB.getPlans().find(p => p.id === params.planId);
    if (!plan) { navigate('home'); return; }
    session = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      planId: plan.id,
      planName: plan.name,
      startTime: Date.now(),
      exercises: plan.exercises.map(ex => ({
        ...ex,
        sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
          setNum: i + 1,
          reps: ex.reps || 10,
          weight: ex.weight || 0,
          duration: ex.duration || 20,
          done: false,
        })),
      })),
    };
    DB.setActiveSession(session);
    DB.setLastPlanId(plan.id);
    // Enable workout tab
    renderNav(document.getElementById('bottom-nav'), 'workout');
  }

  function saveSession() { DB.setActiveSession(session); }

  function formatElapsed(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  function updateElapsed() {
    const el = document.getElementById('elapsed-display');
    if (el) el.textContent = formatElapsed(Date.now() - session.startTime);
  }

  function renderExercise(ex, exIdx) {
    const unit = state.settings.weightUnit;
    const toDisplay = (kg) => unit === 'lbs' ? (kg * 2.20462).toFixed(1) : kg;

    const setsHtml = ex.sets.map((set, si) => {
      if (ex.type === 'cardio') {
        return `
          <div class="set-row">
            <span class="set-num">${si + 1}</span>
            <div>
              <input class="set-input" type="number" min="1" value="${set.duration}"
                data-ex="${exIdx}" data-set="${si}" data-field="duration" style="width:80px">
              <div class="set-label">min</div>
            </div>
            <button class="set-check ${set.done ? 'done' : ''}" data-ex="${exIdx}" data-set="${si}"></button>
          </div>`;
      }
      if (ex.type === 'bodyweight') {
        return `
          <div class="set-row">
            <span class="set-num">${si + 1}</span>
            <div>
              <input class="set-input" type="number" min="1" value="${set.reps}"
                data-ex="${exIdx}" data-set="${si}" data-field="reps">
              <div class="set-label">${t('workout.reps')}</div>
            </div>
            <button class="set-check ${set.done ? 'done' : ''}" data-ex="${exIdx}" data-set="${si}"></button>
          </div>`;
      }
      // weights
      return `
        <div class="set-row">
          <span class="set-num">${si + 1}</span>
          <div>
            <input class="set-input" type="number" min="1" value="${set.reps}"
              data-ex="${exIdx}" data-set="${si}" data-field="reps">
            <div class="set-label">${t('workout.reps')}</div>
          </div>
          <div>
            <input class="set-input" type="number" min="0" step="0.5" value="${toDisplay(set.weight)}"
              data-ex="${exIdx}" data-set="${si}" data-field="weight">
            <div class="set-label">${unit}</div>
          </div>
          <button class="set-check ${set.done ? 'done' : ''}" data-ex="${exIdx}" data-set="${si}"></button>
        </div>`;
    }).join('');

    return `
      <div class="workout-exercise" id="ex-block-${exIdx}">
        <div class="workout-exercise-header">
          <span class="workout-exercise-name">${ex.name}</span>
          <button class="btn-ghost add-set-btn" data-ex="${exIdx}">+Set</button>
        </div>
        ${ex.gifUrl ? `<img src="${ex.gifUrl}" style="width:100%;max-height:160px;object-fit:cover;border-radius:12px;margin-bottom:12px" loading="lazy">` : ''}
        <div class="sets-container">${setsHtml}</div>
      </div>`;
  }

  function render() {
    if (elapsedInterval) clearInterval(elapsedInterval);

    container.innerHTML = `
      <div class="view" id="workout-view">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <h1 class="view-title" style="margin:0">${session.planName}</h1>
        </div>
        <div style="text-align:center;margin-bottom:16px">
          <div class="text-muted" style="font-size:12px;text-transform:uppercase;letter-spacing:1px">${t('workout.elapsed')}</div>
          <div class="elapsed-display" id="elapsed-display">00:00</div>
        </div>
        <div id="workout-exercises">
          ${session.exercises.map((ex, i) => renderExercise(ex, i)).join('')}
        </div>
        <button class="btn btn-secondary" id="add-workout-ex" style="margin-bottom:12px">
          + ${t('workout.addExercise')}
        </button>
        <button class="btn btn-primary" id="finish-workout-btn">${t('workout.finish')}</button>
      </div>
    `;

    elapsedInterval = setInterval(updateElapsed, 1000);
    updateElapsed();

    // Set input changes
    container.querySelectorAll('.set-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const ei = parseInt(inp.dataset.ex);
        const si = parseInt(inp.dataset.set);
        const field = inp.dataset.field;
        if (field === 'weight') {
          session.exercises[ei].sets[si].weight =
            state.settings.weightUnit === 'lbs'
              ? parseFloat(inp.value) / 2.20462
              : parseFloat(inp.value);
        } else {
          session.exercises[ei].sets[si][field] = parseFloat(inp.value) || 0;
        }
        saveSession();
      });
    });

    // Set done checkboxes
    container.querySelectorAll('.set-check').forEach(btn => {
      btn.addEventListener('click', () => {
        const ei = parseInt(btn.dataset.ex);
        const si = parseInt(btn.dataset.set);
        session.exercises[ei].sets[si].done = !session.exercises[ei].sets[si].done;
        btn.classList.toggle('done', session.exercises[ei].sets[si].done);
        saveSession();
        if (session.exercises[ei].sets[si].done) {
          const restSecs = state.settings.restTimerSeconds || 90;
          startRestTimer(restSecs, () => {});
        }
      });
    });

    // Add set
    container.querySelectorAll('.add-set-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ei = parseInt(btn.dataset.ex);
        const ex = session.exercises[ei];
        const last = ex.sets[ex.sets.length - 1] || {};
        ex.sets.push({
          setNum: ex.sets.length + 1,
          reps: last.reps || 10,
          weight: last.weight || 0,
          duration: last.duration || 20,
          done: false,
        });
        saveSession();
        render();
      });
    });

    // Add exercise mid-workout
    document.getElementById('add-workout-ex').addEventListener('click', () => {
      openExercisePicker(ex => {
        session.exercises.push({
          ...ex,
          exerciseId: ex.exerciseId ?? ex.id,
          name: ex.name,
          gifUrl: ex.gifUrl ?? '',
          targetMuscle: ex.targetMuscles?.[0] ?? ex.target ?? '',
          equipment: ex.equipments?.[0] ?? ex.equipment ?? '',
          type: 'weights',
          sets: [{ setNum: 1, reps: 10, weight: 0, duration: 0, done: false }],
        });
        saveSession();
        render();
      });
    });

    // Finish workout
    document.getElementById('finish-workout-btn').addEventListener('click', () => {
      if (!confirm(t('workout.confirmFinish'))) return;
      stopRestTimer();
      clearInterval(elapsedInterval);

      const durationSeconds = Math.floor((Date.now() - session.startTime) / 1000);
      let totalVolumeKg = 0;
      session.exercises.forEach(ex => {
        if (ex.type === 'weights') {
          ex.sets.filter(s => s.done).forEach(s => { totalVolumeKg += (s.weight || 0) * (s.reps || 0); });
        }
      });

      const finishedSession = {
        id: session.id,
        planId: session.planId,
        planName: session.planName,
        date: new Date().toISOString(),
        durationSeconds,
        totalVolumeKg,
        exercises: session.exercises,
      };

      DB.saveSession(finishedSession);
      DB.clearActiveSession();
      renderNav(document.getElementById('bottom-nav'), 'history');
      navigate('history');
    });
  }

  render();
}
