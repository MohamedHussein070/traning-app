// js/views/home.js — Dashboard

import * as DB from '../db.js';
import { navigate, t, state } from '../app.js';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return t('home.greeting.morning');
  if (h < 18) return t('home.greeting.afternoon');
  return t('home.greeting.evening');
}

function getTodayPlan() {
  const today = new Date().getDay(); // 0=Sun
  const now = new Date();
  return DB.getPlans().find(plan => {
    if (!plan.scheduledDays?.includes(today)) return false;
    if (plan.startDate && new Date(plan.startDate + 'T00:00:00') > now) return false;
    if (plan.endDate && new Date(plan.endDate + 'T23:59:59') < now) return false;
    return true;
  });
}

function getWeeklyStats() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const sessions = DB.getSessions().filter(s => new Date(s.date) >= startOfWeek);
  const volume = sessions.reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0);
  return { count: sessions.length, volume };
}

export function renderHome(container) {
  const todayPlan = getTodayPlan();
  const { count, volume } = getWeeklyStats();
  const lastPlanId = DB.getLastPlanId();
  const lastPlan = lastPlanId ? DB.getPlans().find(p => p.id === lastPlanId) : null;
  const unit = state.settings.weightUnit;
  const displayVolume = unit === 'lbs' ? (volume * 2.20462).toFixed(0) : volume.toFixed(0);

  const dateStr = new Date().toLocaleDateString(
    state.settings.language === 'sv' ? 'sv-SE' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );

  function startWorkout(planId) {
    const active = DB.getActiveSession();
    if (active && active.planId !== planId) {
      const planName = active.planName || 'another plan';
      if (!confirm(`You have an unfinished session for "${planName}". Discard it and start a new workout?`)) return;
      DB.clearActiveSession();
    }
    navigate('workout', { planId });
  }

  container.innerHTML = `
    <div class="view">
      <div style="margin-bottom:20px">
        <div style="color:var(--text2);font-size:14px">${dateStr}</div>
        <h1 style="font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:700;margin-top:4px">
          ${getGreeting()} 👋
        </h1>
      </div>

      ${todayPlan ? `
        <div class="today-card">
          <div class="today-label">${t('home.today')}</div>
          <div class="today-plan-name">${todayPlan.name}</div>
          <button class="btn-start" id="start-today">${t('workout.start')}</button>
        </div>
      ` : `
        <div class="card" style="margin-bottom:16px;text-align:center;padding:20px">
          <div style="font-size:32px;margin-bottom:8px">🏖️</div>
          <div style="color:var(--text2)">${t('home.noWorkout')}</div>
        </div>
      `}

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">${count}</div>
          <div class="stat-label">${t('home.weeklyWorkouts')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${displayVolume}</div>
          <div class="stat-label">${t('home.weeklyVolume')} (${unit})</div>
        </div>
      </div>

      ${lastPlan && !todayPlan ? `
        <div class="card" style="margin-bottom:12px">
          <div style="font-size:12px;color:var(--text2);margin-bottom:8px">${t('home.quickStart')}</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;margin-bottom:12px">${lastPlan.name}</div>
          <button class="btn btn-primary" id="quick-start">${t('workout.start')}</button>
        </div>
      ` : ''}
    </div>
  `;

  document.getElementById('start-today')?.addEventListener('click', () => {
    startWorkout(todayPlan.id);
  });
  document.getElementById('quick-start')?.addEventListener('click', () => {
    startWorkout(lastPlan.id);
  });
}
