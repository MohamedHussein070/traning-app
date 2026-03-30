// js/api.js — ExerciseDB API with localStorage cache

import { getCachedEndpoint, setCachedEndpoint } from './db.js';

const BASE = 'https://exercisedb-api.vercel.app';

async function fetchEndpoint(endpoint) {
  const cached = getCachedEndpoint(endpoint);
  if (cached) return cached;

  const res = await fetch(BASE + endpoint);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  // API returns { success, data: { exercises: [...] } } or { success, data: [...] }
  let data = json;
  if (json.data !== undefined) {
    data = Array.isArray(json.data) ? json.data
      : (json.data.exercises ?? json.data);
  }
  setCachedEndpoint(endpoint, data);
  return data;
}

export async function getBodyPartList() {
  // Returns array of body part strings
  return fetchEndpoint('/api/v1/exercises/bodyParts');
}

export async function getExercisesByBodyPart(bodyPart) {
  return fetchEndpoint(`/api/v1/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=100&offset=0`);
}

export async function getExerciseById(id) {
  return fetchEndpoint(`/api/v1/exercises/${id}`);
}

export async function getAllExercises() {
  // Load all body parts, then load each — fallback to first body part only
  try {
    const parts = await getBodyPartList();
    const results = await Promise.all(
      parts.map(p => getExercisesByBodyPart(p).catch(() => []))
    );
    return results.flat();
  } catch {
    return [];
  }
}
