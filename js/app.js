// js/app.js — Router, global state, translations, boot

import * as DB from './db.js';
import { renderNav } from './components/nav.js';
import { renderHome } from './views/home.js';
import { renderPlans } from './views/plans.js';
import { renderWorkout } from './views/workout.js';
import { renderHistory } from './views/history.js';
import { renderProgress } from './views/progress.js';
import { renderSettings } from './views/settings.js';

// ── Translations ───────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    'nav.home': 'Home', 'nav.plans': 'Plans',
    'nav.workout': 'Workout', 'nav.history': 'History',
    'home.greeting.morning': 'Good morning', 'home.greeting.afternoon': 'Good afternoon',
    'home.greeting.evening': 'Good evening',
    'home.today': "Today's Workout", 'home.noWorkout': 'No workout scheduled today',
    'home.weeklyWorkouts': 'Workouts this week', 'home.weeklyVolume': 'Volume this week',
    'home.quickStart': 'Quick Start', 'home.lastPlan': 'Last plan',
    'plans.title': 'Plans', 'plans.new': 'New Plan', 'plans.empty': 'No plans yet. Tap + to create one.',
    'plans.name': 'Plan Name', 'plans.addExercise': 'Add Exercise',
    'plans.startDate': 'Start Date', 'plans.endDate': 'End Date',
    'plans.scheduledDays': 'Training Days', 'plans.exercises': 'exercises',
    'plans.noExercises': 'No exercises added yet.', 'plans.delete': 'Delete Plan',
    'plans.save': 'Save Plan', 'plans.edit': 'Edit',
    'plans.sets': 'Sets', 'plans.reps': 'Reps', 'plans.weight': 'Weight (kg)',
    'plans.duration': 'Duration (min)', 'plans.type': 'Type',
    'plans.type.weights': 'Weights', 'plans.type.bodyweight': 'Bodyweight', 'plans.type.cardio': 'Cardio',
    'workout.start': 'Start Workout', 'workout.finish': 'Finish Workout',
    'workout.restTimer': 'Rest Timer', 'workout.sets': 'Sets',
    'workout.reps': 'Reps', 'workout.weight': 'Weight', 'workout.duration': 'Duration',
    'workout.addExercise': 'Add Exercise', 'workout.elapsed': 'Elapsed',
    'workout.skipRest': 'Skip Rest', 'workout.confirmFinish': 'Finish this workout?',
    'history.title': 'History', 'history.empty': 'No workouts logged yet.',
    'history.volume': 'Volume', 'history.duration': 'Duration',
    'history.viewProgress': 'View Progress',
    'progress.title': 'Progress', 'progress.selectExercise': 'Select Exercise',
    'progress.noData': 'No data yet for this exercise.',
    'progress.maxWeight': 'Max Weight', 'progress.range.30': 'Last 30 days',
    'progress.range.90': 'Last 90 days', 'progress.range.all': 'All time',
    'settings.title': 'Settings', 'settings.theme': 'Dark Mode',
    'settings.language': 'Language', 'settings.restTimer': 'Default Rest Timer (sec)',
    'settings.weightUnit': 'Weight Unit', 'settings.clearData': 'Clear All Data',
    'settings.clearConfirm': 'Type DELETE to confirm', 'settings.saved': 'Saved',
    'days.0': 'Sun', 'days.1': 'Mon', 'days.2': 'Tue', 'days.3': 'Wed',
    'days.4': 'Thu', 'days.5': 'Fri', 'days.6': 'Sat',
    'picker.title': 'Add Exercise', 'picker.search': 'Search exercises…',
    'picker.bodyPart': 'Body Part', 'picker.add': 'Add to Plan',
    'picker.addWorkout': 'Add to Workout', 'picker.loading': 'Loading exercises…',
    'picker.error': 'Could not load exercises.',
    'confirm.yes': 'Yes', 'confirm.no': 'Cancel', 'confirm.delete': 'Delete',
  },
  sv: {
    'nav.home': 'Hem', 'nav.plans': 'Program',
    'nav.workout': 'Träning', 'nav.history': 'Historik',
    'home.greeting.morning': 'God morgon', 'home.greeting.afternoon': 'God eftermiddag',
    'home.greeting.evening': 'God kväll',
    'home.today': 'Dagens träning', 'home.noWorkout': 'Inget pass schemalagt idag',
    'home.weeklyWorkouts': 'Pass denna vecka', 'home.weeklyVolume': 'Volym denna vecka',
    'home.quickStart': 'Snabbstart', 'home.lastPlan': 'Senaste program',
    'plans.title': 'Program', 'plans.new': 'Nytt program', 'plans.empty': 'Inga program. Tryck + för att skapa.',
    'plans.name': 'Programnamn', 'plans.addExercise': 'Lägg till övning',
    'plans.startDate': 'Startdatum', 'plans.endDate': 'Slutdatum',
    'plans.scheduledDays': 'Träningsdagar', 'plans.exercises': 'övningar',
    'plans.noExercises': 'Inga övningar tillagda.', 'plans.delete': 'Ta bort program',
    'plans.save': 'Spara program', 'plans.edit': 'Redigera',
    'plans.sets': 'Set', 'plans.reps': 'Reps', 'plans.weight': 'Vikt (kg)',
    'plans.duration': 'Tid (min)', 'plans.type': 'Typ',
    'plans.type.weights': 'Vikter', 'plans.type.bodyweight': 'Kroppsvikt', 'plans.type.cardio': 'Cardio',
    'workout.start': 'Starta träning', 'workout.finish': 'Avsluta träning',
    'workout.restTimer': 'Vilotimer', 'workout.sets': 'Set',
    'workout.reps': 'Reps', 'workout.weight': 'Vikt', 'workout.duration': 'Tid',
    'workout.addExercise': 'Lägg till övning', 'workout.elapsed': 'Förfluten tid',
    'workout.skipRest': 'Hoppa över vila', 'workout.confirmFinish': 'Avsluta träningspasset?',
    'history.title': 'Historik', 'history.empty': 'Inga pass loggade än.',
    'history.volume': 'Volym', 'history.duration': 'Tid',
    'history.viewProgress': 'Visa framsteg',
    'progress.title': 'Framsteg', 'progress.selectExercise': 'Välj övning',
    'progress.noData': 'Ingen data än för denna övning.',
    'progress.maxWeight': 'Maxvikt', 'progress.range.30': 'Senaste 30 dagarna',
    'progress.range.90': 'Senaste 90 dagarna', 'progress.range.all': 'All tid',
    'settings.title': 'Inställningar', 'settings.theme': 'Mörkt läge',
    'settings.language': 'Språk', 'settings.restTimer': 'Standard vilotimer (sek)',
    'settings.weightUnit': 'Viktenhet', 'settings.clearData': 'Rensa all data',
    'settings.clearConfirm': 'Skriv RADERA för att bekräfta', 'settings.saved': 'Sparat',
    'days.0': 'Sön', 'days.1': 'Mån', 'days.2': 'Tis', 'days.3': 'Ons',
    'days.4': 'Tor', 'days.5': 'Fre', 'days.6': 'Lör',
    'picker.title': 'Lägg till övning', 'picker.search': 'Sök övningar…',
    'picker.bodyPart': 'Muskelgrupp', 'picker.add': 'Lägg till i program',
    'picker.addWorkout': 'Lägg till i pass', 'picker.loading': 'Laddar övningar…',
    'picker.error': 'Kunde inte ladda övningar.',
    'confirm.yes': 'Ja', 'confirm.no': 'Avbryt', 'confirm.delete': 'Ta bort',
  },
};

// ── State ──────────────────────────────────────────────────────────
export const state = {
  currentView: 'home',
  params: {},
  settings: DB.getSettings(),
};

// ── Translation ────────────────────────────────────────────────────
export function t(key) {
  const lang = state.settings.language;
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

// ── View registry ──────────────────────────────────────────────────
const VIEW_RENDERERS = {
  home: renderHome,
  plans: renderPlans,
  workout: renderWorkout,
  history: renderHistory,
  progress: renderProgress,
  settings: renderSettings,
};

// ── Router ─────────────────────────────────────────────────────────
export function navigate(viewName, params = {}) {
  state.currentView = viewName;
  state.params = params;
  const app = document.getElementById('app');
  app.innerHTML = '';
  VIEW_RENDERERS[viewName]?.(app, params);
  renderNav(document.getElementById('bottom-nav'), viewName);
  window.scrollTo(0, 0);
}

// ── Top bar ────────────────────────────────────────────────────────
function initTopBar() {
  const langBtn = document.getElementById('lang-toggle');
  const settingsBtn = document.getElementById('settings-btn');

  langBtn.textContent = state.settings.language.toUpperCase();

  langBtn.addEventListener('click', () => {
    state.settings.language = state.settings.language === 'en' ? 'sv' : 'en';
    DB.saveSettings(state.settings);
    langBtn.textContent = state.settings.language.toUpperCase();
    navigate(state.currentView, state.params);
  });

  settingsBtn.addEventListener('click', () => navigate('settings'));
}

// ── Boot ───────────────────────────────────────────────────────────
function boot() {
  state.settings = DB.getSettings();
  document.documentElement.setAttribute('data-theme', state.settings.theme);
  initTopBar();
  const active = DB.getActiveSession();
  if (active) {
    navigate('workout', { resume: true });
  } else {
    navigate('home');
  }
}

document.addEventListener('DOMContentLoaded', boot);
