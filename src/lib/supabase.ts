import { createClient } from '@supabase/supabase-js';

type DataSourceMode = 'mock' | 'supabase' | 'auto';

const modeFromCommand = `${import.meta.env.MODE ?? ''}`.toLowerCase();
const modeFromEnv = `${import.meta.env.VITE_DATA_SOURCE ?? ''}`.toLowerCase();
const rawMode =
    modeFromCommand === 'mock' || modeFromCommand === 'supabase'
        ? modeFromCommand
        : (modeFromEnv || modeFromCommand);
export const dataSourceMode: DataSourceMode =
    rawMode === 'mock' || rawMode === 'supabase' || rawMode === 'auto' ? rawMode : 'auto';

export const isMockMode = dataSourceMode === 'mock';
export const isSupabaseMode = dataSourceMode === 'supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if ((isSupabaseMode || dataSourceMode === 'auto') && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn('Supabase credentials not found. Supabase mode will be unavailable.');
}

export const supabase = !isMockMode && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = !!supabase;

// Centralized flag for determining if mock data should be used
// Used by both api.ts (read operations) and api-write.ts (write operations)
const isAutoMode = dataSourceMode === 'auto';
const allowMockFallback = dataSourceMode !== 'supabase';
export const shouldUseMockData = isMockMode || (isAutoMode && !isSupabaseConfigured);
export { allowMockFallback };
