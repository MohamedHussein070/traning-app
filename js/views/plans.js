// js/views/plans.js — Plan list + Plan detail

import * as DB from '../db.js';
import { navigate, t, state } from '../app.js';
import { openExercisePicker } from './exercise-picker.js';

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function renderPlans(container, params = {}) {
  if (params.planId) {
    renderPlanDetail(container, params.planId);
  } else {
    renderPlanList(container);
  }
}

// ── Plan List ──────────────────────────────────────────────────────
function renderPlanList(container) {
  const plans = DB.getPlans();
  const dayNames = [0,1,2,3,4,5,6].map(d => t(`days.${d}`));

  container.innerHTML = `
    <div class="view">
      <h1 class="view-title">${t('plans.title')}</h1>
      <div id="plan-list">
        ${plans.length === 0
          ? `<div class="empty-state">
               <div class="empty-state-icon">💪</div>
               <div class="empty-state-text">${t('plans.empty')}</div>
             </div>`
          : plans.map(plan => {
              const dayPills = (plan.scheduledDays || []).sort().map(d =>
                `<span class="plan-day-pill">${dayNames[d]}</span>`).join('');
              const dateRange = plan.startDate && plan.endDate
                ? `${plan.startDate} → ${plan.endDate}` : '';
              return `
                <div class="plan-card" data-id="${plan.id}">
                  <div class="plan-card-name">${esc(plan.name)}</div>
                  <div class="plan-card-meta">
                    ${plan.exercises?.length ?? 0} ${t('plans.exercises')}
                    ${dateRange ? ' · ' + dateRange : ''}
                  </div>
                  <div class="plan-card-days">${dayPills}</div>
                </div>`;
            }).join('')
        }
      </div>
    </div>
    <button class="fab" id="new-plan-btn" aria-label="${t('plans.new')}">＋</button>
  `;

  container.querySelectorAll('.plan-card').forEach(card => {
    card.addEventListener('click', () => navigate('plans', { planId: card.dataset.id }));
  });

  document.getElementById('new-plan-btn').addEventListener('click', () => {
    const id = DB.createPlanId();
    DB.savePlan({ id, name: '', exercises: [], scheduledDays: [], startDate: '', endDate: '' });
    navigate('plans', { planId: id, isNew: true });
  });
}

// ── Plan Detail ────────────────────────────────────────────────────
function renderPlanDetail(container, planId) {
  let plan = DB.getPlans().find(p => p.id === planId);
  if (!plan) { navigate('plans'); return; }

  function save() {
    plan.name = document.getElementById('plan-name-input').value.trim() || 'My Plan';
    plan.startDate = document.getElementById('plan-start').value;
    plan.endDate = document.getElementById('plan-end').value;
    DB.savePlan(plan);
  }

  function render() {
    const dayNames = [0,1,2,3,4,5,6].map(d => t(`days.${d}`));
    container.innerHTML = `
      <div class="view">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <button class="btn-icon" id="back-btn">←</button>
          <h1 class="view-title" style="margin:0;flex:1">${esc(plan.name) || t('plans.new')}</h1>
        </div>

        <div class="card" style="margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">${t('plans.name')}</label>
            <input class="input" id="plan-name-input" value="${esc(plan.name)}" placeholder="${t('plans.name')}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group" style="margin:0">
              <label class="form-label">${t('plans.startDate')}</label>
              <input class="input" type="date" id="plan-start" value="${plan.startDate || ''}">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label">${t('plans.endDate')}</label>
              <input class="input" type="date" id="plan-end" value="${plan.endDate || ''}">
            </div>
          </div>
          <div class="form-group" style="margin-top:16px;margin-bottom:0">
            <label class="form-label">${t('plans.scheduledDays')}</label>
            <div class="day-selector">
              ${[0,1,2,3,4,5,6].map(d => `
                <button class="day-btn ${plan.scheduledDays.includes(d) ? 'active' : ''}" data-day="${d}">
                  ${dayNames[d]}
                </button>`).join('')}
            </div>
          </div>
        </div>

        <h2 style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;margin-bottom:12px">
          ${t('plans.exercises').charAt(0).toUpperCase() + t('plans.exercises').slice(1)}
        </h2>
        <div id="exercise-list">
          ${plan.exercises.length === 0
            ? `<div class="empty-state" style="padding:30px 0">
                 <div class="empty-state-text">${t('plans.noExercises')}</div>
               </div>`
            : plan.exercises.map((ex, i) => renderExerciseRow(ex, i, plan.exercises.length)).join('')
          }
        </div>

        <button class="btn btn-secondary" id="add-ex-btn" style="margin-top:8px">
          + ${t('plans.addExercise')}
        </button>
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <button class="btn btn-danger" id="delete-plan-btn">${t('plans.delete')}</button>
          <button class="btn btn-primary" id="save-plan-btn">${t('plans.save')}</button>
        </div>
      </div>
    `;

    // Day toggle
    container.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = parseInt(btn.dataset.day);
        if (plan.scheduledDays.includes(d)) {
          plan.scheduledDays = plan.scheduledDays.filter(x => x !== d);
          btn.classList.remove('active');
        } else {
          plan.scheduledDays.push(d);
          btn.classList.add('active');
        }
        DB.savePlan(plan);
      });
    });

    document.getElementById('plan-name-input').addEventListener('blur', save);
    document.getElementById('plan-start').addEventListener('change', save);
    document.getElementById('plan-end').addEventListener('change', save);

    document.getElementById('back-btn').addEventListener('click', () => { save(); navigate('plans'); });

    document.getElementById('save-plan-btn').addEventListener('click', () => { save(); navigate('plans'); });

    document.getElementById('delete-plan-btn').addEventListener('click', () => {
      if (confirm(`${t('confirm.delete')} "${esc(plan.name)}"?`)) {
        DB.deletePlan(plan.id);
        navigate('plans');
      }
    });

    document.getElementById('add-ex-btn').addEventListener('click', () => {
      openExercisePicker(ex => {
        const exercise = {
          exerciseId: ex.exerciseId ?? ex.id,
          name: ex.name,
          gifUrl: ex.gifUrl ?? '',
          targetMuscle: ex.targetMuscles?.[0] ?? ex.target ?? '',
          equipment: ex.equipments?.[0] ?? ex.equipment ?? '',
          type: 'weights',
          sets: 3,
          reps: 10,
          weight: 0,
          duration: 0,
          order: plan.exercises.length,
        };
        plan.exercises.push(exercise);
        DB.savePlan(plan);
        render();
      });
    });

    // Exercise row controls
    container.querySelectorAll('.ex-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i);
        if (i === 0) return;
        [plan.exercises[i - 1], plan.exercises[i]] = [plan.exercises[i], plan.exercises[i - 1]];
        DB.savePlan(plan);
        render();
      });
    });
    container.querySelectorAll('.ex-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i);
        if (i === plan.exercises.length - 1) return;
        [plan.exercises[i], plan.exercises[i + 1]] = [plan.exercises[i + 1], plan.exercises[i]];
        DB.savePlan(plan);
        render();
      });
    });
    container.querySelectorAll('.ex-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        plan.exercises.splice(parseInt(btn.dataset.i), 1);
        DB.savePlan(plan);
        render();
      });
    });
    container.querySelectorAll('.ex-type-select').forEach(sel => {
      sel.addEventListener('change', () => {
        plan.exercises[parseInt(sel.dataset.i)].type = sel.value;
        DB.savePlan(plan);
        render();
      });
    });
    container.querySelectorAll('.ex-sets').forEach(inp => {
      inp.addEventListener('change', () => {
        plan.exercises[parseInt(inp.dataset.i)].sets = parseInt(inp.value) || 1;
        DB.savePlan(plan);
      });
    });
    container.querySelectorAll('.ex-reps').forEach(inp => {
      inp.addEventListener('change', () => {
        plan.exercises[parseInt(inp.dataset.i)].reps = parseInt(inp.value) || 1;
        DB.savePlan(plan);
      });
    });
    container.querySelectorAll('.ex-weight').forEach(inp => {
      inp.addEventListener('change', () => {
        const raw = parseFloat(inp.value) || 0;
        plan.exercises[parseInt(inp.dataset.i)].weight =
          state.settings.weightUnit === 'lbs' ? raw / 2.20462 : raw;
        DB.savePlan(plan);
      });
    });
    container.querySelectorAll('.ex-duration').forEach(inp => {
      inp.addEventListener('change', () => {
        plan.exercises[parseInt(inp.dataset.i)].duration = parseInt(inp.value) || 0;
        DB.savePlan(plan);
      });
    });
  }

  render();
}

function renderExerciseRow(ex, i, total) {
  const unit = state.settings.weightUnit;
  const displayWeight = unit === 'lbs' ? parseFloat((ex.weight * 2.20462).toFixed(1)) : (ex.weight || 0);

  const typeOptions = ['weights','bodyweight','cardio'].map(type =>
    `<option value="${type}" ${ex.type === type ? 'selected' : ''}>${t('plans.type.' + type)}</option>`
  ).join('');

  return `
    <div class="card" style="margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;gap:10px">
        ${ex.gifUrl ? `<img src="${esc(ex.gifUrl)}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0" loading="lazy">` : ''}
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:15px;margin-bottom:4px">${esc(ex.name)}</div>
          <div style="font-size:12px;color:var(--text2)">${esc(ex.targetMuscle)} · ${esc(ex.equipment)}</div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="btn-icon ex-up" data-i="${i}" style="font-size:14px;width:36px;height:36px" ${i===0?'disabled':''}>↑</button>
          <button class="btn-icon ex-down" data-i="${i}" style="font-size:14px;width:36px;height:36px" ${i===total-1?'disabled':''}>↓</button>
          <button class="btn-icon ex-delete" data-i="${i}" style="font-size:14px;width:36px;height:36px;color:var(--danger)">✕</button>
        </div>
      </div>
      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-items:end">
        <div>
          <div class="form-label">${t('plans.type')}</div>
          <select class="input ex-type-select" data-i="${i}" style="padding:8px">${typeOptions}</select>
        </div>
        ${ex.type === 'cardio' ? `
          <div>
            <div class="form-label">${t('plans.duration')}</div>
            <input class="input ex-duration" data-i="${i}" type="number" min="1" value="${ex.duration || 20}" style="padding:8px">
          </div>
        ` : `
          <div>
            <div class="form-label">${t('plans.sets')}</div>
            <input class="input ex-sets" data-i="${i}" type="number" min="1" value="${ex.sets || 3}" style="padding:8px">
          </div>
          <div>
            <div class="form-label">${t('plans.reps')}</div>
            <input class="input ex-reps" data-i="${i}" type="number" min="1" value="${ex.reps || 10}" style="padding:8px">
          </div>
          ${ex.type === 'weights' ? `
            <div>
              <div class="form-label">${t('workout.weight')} (${unit})</div>
              <input class="input ex-weight" data-i="${i}" type="number" min="0" step="0.5" value="${displayWeight}" style="padding:8px">
            </div>
          ` : ''}
        `}
      </div>
    </div>
  `;
}
