// js/api.js — ExerciseDB API with localStorage cache

import { getCachedEndpoint, setCachedEndpoint } from './db.js';

const BASE = 'https://exercisedb-api.vercel.app';

async function fetchEndpoint(endpoint) {
  const cached = getCachedEndpoint(endpoint);
  if (cached) return cached;

  const res = await fetch(BASE + endpoint);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  // API returns { data: [...] } or just an array
  const data = json.data ?? json;
  setCachedEndpoint(endpoint, data);
  return data;
}

export async function getBodyPartList() {
  return fetchEndpoint('/api/v1/exercises/bodyPartList');
}

export async function getExercisesByBodyPart(bodyPart) {
  return fetchEndpoint(`/api/v1/exercises/bodyPart/${encodeURIComponent(bodyPart)}`);
}

export async function getExerciseById(id) {
  return fetchEndpoint(`/api/v1/exercises/${id}`);
}

export async function getAllExercises() {
  return fetchEndpoint('/api/v1/exercises?limit=1300');
}
