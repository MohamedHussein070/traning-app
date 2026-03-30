// js/views/progress.js — Per-exercise weight/rep progress chart

import * as DB from '../db.js';
import { navigate, t, state } from '../app.js';

export function renderProgress(container, params = {}) {
  const sessions = DB.getSessions();

  // Build list of unique exercise names from all sessions
  const exerciseNames = [...new Set(
    sessions.flatMap(s => s.exercises.map(e => e.name))
  )].sort();

  const selectedName = params.exerciseName || exerciseNames[0] || '';
  let range = params.range || 'all';

  function getChartData(name, rangeVal) {
    const cutoff = rangeVal === '30' ? 30 : rangeVal === '90' ? 90 : null;
    const cutoffDate = cutoff ? new Date(Date.now() - cutoff * 86400000) : null;

    const points = [];
    sessions
      .filter(s => !cutoffDate || new Date(s.date) >= cutoffDate)
      .slice().reverse()
      .forEach(s => {
        const ex = s.exercises.find(e => e.name === name);
        if (!ex) return;
        if (ex.type === 'weights') {
          const maxWeight = Math.max(...ex.sets.filter(st => st.done).map(st => st.weight || 0));
          if (maxWeight > 0) points.push({ date: s.date, value: maxWeight });
        } else if (ex.type === 'bodyweight') {
          const maxReps = Math.max(...ex.sets.filter(st => st.done).map(st => st.reps || 0));
          if (maxReps > 0) points.push({ date: s.date, value: maxReps });
        }
      });
    return points;
  }

  function renderChart(name, rangeVal) {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;
    chartContainer.innerHTML = '<canvas id="progress-chart"></canvas>';

    const data = getChartData(name, rangeVal);
    if (!data.length) {
      chartContainer.innerHTML = `<div class="empty-state" style="padding:40px 0"><div class="empty-state-text">${t('progress.noData')}</div></div>`;
      return;
    }

    const unit = state.settings.weightUnit;
    const toDisplay = kg => unit === 'lbs' ? parseFloat((kg * 2.20462).toFixed(1)) : kg;

    const ex = sessions.flatMap(s => s.exercises).find(e => e.name === name);
    const isWeight = ex?.type === 'weights';
    const yLabel = isWeight ? `${t('progress.maxWeight')} (${unit})` : `Max Reps`;

    new Chart(document.getElementById('progress-chart'), {
      type: 'line',
      data: {
        labels: data.map(p => new Date(p.date).toLocaleDateString()),
        datasets: [{
          label: yLabel,
          data: data.map(p => isWeight ? toDisplay(p.value) : p.value),
          borderColor: '#0A84FF',
          backgroundColor: 'rgba(10,132,255,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#0A84FF',
          pointRadius: 5,
          tension: 0.3,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1C1C1E',
            titleColor: '#fff',
            bodyColor: '#AEAEB2',
          },
        },
        scales: {
          x: { ticks: { color: '#AEAEB2', maxTicksLimit: 6 }, grid: { color: '#3A3A3C' } },
          y: { ticks: { color: '#AEAEB2' }, grid: { color: '#3A3A3C' } },
        },
      },
    });
  }

  container.innerHTML = `
    <div class="view">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <button class="btn-icon" id="back-btn">←</button>
        <h1 class="view-title" style="margin:0">${t('progress.title')}</h1>
      </div>

      ${exerciseNames.length === 0
        ? `<div class="empty-state"><div class="empty-state-icon">📈</div><div class="empty-state-text">${t('history.empty')}</div></div>`
        : `
          <div class="form-group">
            <label class="form-label">${t('progress.selectExercise')}</label>
            <select class="input" id="exercise-select">
              ${exerciseNames.map(n => `<option value="${n}" ${n === selectedName ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
          <div class="chip-row" id="range-chips">
            ${[['30', t('progress.range.30')], ['90', t('progress.range.90')], ['all', t('progress.range.all')]].map(([val, label]) =>
              `<button class="chip ${range === val ? 'active' : ''}" data-range="${val}">${label}</button>`
            ).join('')}
          </div>
          <div class="chart-container" id="chart-container"></div>
        `
      }
    </div>
  `;

  if (exerciseNames.length) renderChart(selectedName, range);

  document.getElementById('back-btn')?.addEventListener('click', () => navigate('history'));

  document.getElementById('exercise-select')?.addEventListener('change', e => {
    renderChart(e.target.value, range);
  });

  document.querySelectorAll('#range-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#range-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      range = chip.dataset.range;
      renderChart(document.getElementById('exercise-select').value, range);
    });
  });
}
