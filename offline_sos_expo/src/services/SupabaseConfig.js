import { createClient } from '@supabase/supabase-js';

// SUPABASE CONFIGURATION (Active Live Supabase Project)
export const SUPABASE_URL = "https://ouabwbkhwojprwrqcafg.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_WuatJ1MrM7CibNxI9Q4Qeg_4H1cBpQh";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

let sharedRealtimeChannel = null;

export function getSharedRealtimeChannel() {
  if (sharedRealtimeChannel) {
    try {
      supabase.removeChannel(sharedRealtimeChannel);
    } catch (_) {}
    sharedRealtimeChannel = null;
  }
  sharedRealtimeChannel = supabase.channel('emergency_wal_mesh', {
    config: {
      broadcast: { self: true },
    },
  });
  return sharedRealtimeChannel;
}

