// js/components/nav.js

import { navigate, t, state } from '../app.js';
import * as DB from '../db.js';

const TABS = [
  { id: 'home',    icon: '🏠', labelKey: 'nav.home' },
  { id: 'plans',   icon: '💪', labelKey: 'nav.plans' },
  { id: 'workout', icon: '▶️', labelKey: 'nav.workout' },
  { id: 'history', icon: '📊', labelKey: 'nav.history' },
];

export function renderNav(container, activeView) {
  const hasActiveSession = !!DB.getActiveSession();
  container.innerHTML = TABS.map(tab => {
    const isActive = tab.id === activeView;
    const isDisabled = tab.id === 'workout' && !hasActiveSession;
    return `<button
      class="nav-tab ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}"
      data-view="${tab.id}"
      aria-label="${t(tab.labelKey)}"
    >
      <span class="nav-icon">${tab.icon}</span>
      <span>${t(tab.labelKey)}</span>
    </button>`;
  }).join('');

  container.querySelectorAll('.nav-tab:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });
}
