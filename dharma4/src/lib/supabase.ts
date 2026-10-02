import { createClient } from '@supabase/supabase-js';

// Environment variables check (optional Supabase integration)
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Local Storage persistent state wrapper to ensure 100% instant interactive functionality
 * in preview when Supabase credentials are not yet set.
 */
export const getLocalData = <T>(key: string, fallbackDefault: T): T => {
  try {
    const item = localStorage.getItem(`dharma_books_${key}`);
    return item ? JSON.parse(item) : fallbackDefault;
  } catch (err) {
    console.warn(`Error reading localStorage for key ${key}:`, err);
    return fallbackDefault;
  }
};

export const setLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`dharma_books_${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error setting localStorage for key ${key}:`, err);
  }
};
