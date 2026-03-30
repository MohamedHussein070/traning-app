// js/views/settings.js

import * as DB from '../db.js';
import { navigate, t, state } from '../app.js';

export function renderSettings(container) {
  let settings = DB.getSettings();

  function save() { DB.saveSettings(settings); state.settings = settings; }

  container.innerHTML = `
    <div class="view">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <button class="btn-icon" id="back-btn">←</button>
        <h1 class="view-title" style="margin:0">${t('settings.title')}</h1>
      </div>

      <div class="card">
        <div class="toggle-row">
          <span class="toggle-label">${t('settings.theme')}</span>
          <button class="toggle ${settings.theme === 'dark' ? 'on' : ''}" id="theme-toggle"></button>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">${t('settings.language')}</span>
          <div style="display:flex;gap:8px">
            <button class="chip ${settings.language === 'en' ? 'active' : ''}" id="lang-en">EN</button>
            <button class="chip ${settings.language === 'sv' ? 'active' : ''}" id="lang-sv">SV</button>
          </div>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">${t('settings.weightUnit')}</span>
          <div style="display:flex;gap:8px">
            <button class="chip ${settings.weightUnit === 'kg' ? 'active' : ''}" id="unit-kg">kg</button>
            <button class="chip ${settings.weightUnit === 'lbs' ? 'active' : ''}" id="unit-lbs">lbs</button>
          </div>
        </div>
        <div class="toggle-row" style="border:none">
          <span class="toggle-label">${t('settings.restTimer')}</span>
          <input class="input" id="rest-input" type="number" min="10" max="600"
            value="${settings.restTimerSeconds}" style="width:80px;text-align:center">
        </div>
      </div>

      <button class="btn btn-danger" id="clear-btn" style="margin-top:24px">
        ${t('settings.clearData')}
      </button>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('home'));

  document.getElementById('theme-toggle').addEventListener('click', function() {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    this.classList.toggle('on', settings.theme === 'dark');
    document.documentElement.setAttribute('data-theme', settings.theme);
    save();
  });

  document.getElementById('lang-en').addEventListener('click', () => {
    settings.language = 'en';
    document.getElementById('lang-toggle').textContent = 'EN';
    save();
    navigate('settings');
  });
  document.getElementById('lang-sv').addEventListener('click', () => {
    settings.language = 'sv';
    document.getElementById('lang-toggle').textContent = 'SV';
    save();
    navigate('settings');
  });

  document.getElementById('unit-kg').addEventListener('click', () => {
    settings.weightUnit = 'kg';
    save();
    navigate('settings');
  });
  document.getElementById('unit-lbs').addEventListener('click', () => {
    settings.weightUnit = 'lbs';
    save();
    navigate('settings');
  });

  document.getElementById('rest-input').addEventListener('change', function() {
    settings.restTimerSeconds = parseInt(this.value) || 90;
    save();
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    const confirmWord = settings.language === 'sv' ? 'RADERA' : 'DELETE';
    const input = prompt(t('settings.clearConfirm'));
    if (input === confirmWord) {
      DB.clearAllData();
      location.reload();
    }
  });
}
