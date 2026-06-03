import type { ActivityLogUrlState } from './activity-log-url';

export interface SavedActivityLogPreset {
  id: string;
  name: string;
  filters: Pick<
    ActivityLogUrlState,
    'source' | 'from' | 'to' | 'tableName' | 'actionType' | 'recordedBy' | 'search'
  >;
  savedAt: string;
}

const STORAGE_KEY = 'sintak_activity_log_presets';
const MAX_PRESETS = 12;

export function loadActivityLogPresets(): SavedActivityLogPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveActivityLogPreset(
  name: string,
  filters: SavedActivityLogPreset['filters']
): SavedActivityLogPreset[] {
  const presets = loadActivityLogPresets();
  const entry: SavedActivityLogPreset = {
    id: `${Date.now()}`,
    name: name.trim().slice(0, 40) || 'Preset tanpa nama',
    filters,
    savedAt: new Date().toISOString(),
  };
  const next = [entry, ...presets.filter((p) => p.name !== entry.name)].slice(0, MAX_PRESETS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteActivityLogPreset(id: string): SavedActivityLogPreset[] {
  const next = loadActivityLogPresets().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
