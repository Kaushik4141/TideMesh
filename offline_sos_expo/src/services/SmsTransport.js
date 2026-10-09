import { LocalWalStore, normalizePhoneSender, isEmergencyProtocolMessage } from './LocalWalStore';
import { supabase, getSharedRealtimeChannel } from './SupabaseConfig';
import { executeNeonQuery } from './NeonConfig';
import { BleMeshTransport } from './BleMeshTransport';

const smsListeners = new Set();

export function subscribeSmsEvents(listener) {
  smsListeners.add(listener);
  return () => smsListeners.delete(listener);
}

function notifySmsListeners(event) {
  smsListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (e) {
      console.error('SMS listener error:', e);
    }
  });
}

export class SmsTransport {
  static async isAvailable() {
    return true;
  }

  static async sendSms(to, message) {
    console.log(`[IN-APP & REALTIME TRANSMISSION] to: ${to}, payload: ${message}`);
    
    // 1. Notify local in-app listeners
    notifySmsListeners({
      type: 'OUTGOING',
      to,
      message,
      timestamp: Date.now(),
    });

    // 2. Direct Neon Postgres & Supabase Database Insert
    try {
      const parts = message.split('|');
      const victimLoc =
        parts.length >= 4 && (parts[0] === 'SOS' || parts[0] === 'ALT')
          ? `${parts[2]}, ${parts[3]}`
          : null;

      const hlcStamp = `${Date.now()}:0:${to || 'VICTIM'}`;

      executeNeonQuery(
        `INSERT INTO emergency_wal_logs (hlc_timestamp, sender, payload, status, victim_location) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (hlc_timestamp) DO NOTHING;`,
        [hlcStamp, String(to || 'VICTIM_NODE'), message, parts[0] || 'SOS', victimLoc]
      );

      supabase
        .from('emergency_wal_logs')
        .insert({
          hlc_timestamp: hlcStamp,
          sender: String(to || 'VICTIM_NODE'),
          payload: message,
          status: parts[0] || 'SOS',
          victim_location: victimLoc,
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase DB insert notice:', error);
        });

      const channel = getSharedRealtimeChannel();
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'sos_alert',
          payload: {
            sender: to || 'VICTIM_NODE',
            payload: message,
            isSentByMe: false,
            timestamp: Date.now(),
          },
        });
      }
    } catch (e) {
      console.warn('Realtime transmission notice:', e);
    }

    // 3. Broadcast over BLE Mesh Network
    try {
      BleMeshTransport.broadcastPacket(message, to);
    } catch (bleErr) {
      console.warn('BLE Mesh broadcast exception:', bleErr);
    }
  }

  static async simulateIncomingSms(sender, body) {
    console.log(`[SMS SIMULATED INCOMING] from: ${sender}, payload: ${body}`);
    if (!body || !isEmergencyProtocolMessage(body)) return;

    const cleanSender = normalizePhoneSender(sender);
    const now = Date.now();
    const hlc = `${now}:0:BG_NODE`;

    await LocalWalStore.insertRecord({
      hlc,
      sender: cleanSender,
      payload: body,
      isMe: false,
    });

    notifySmsListeners({
      type: 'INCOMING',
      sender: cleanSender,
      message: body,
      timestamp: now,
    });
  }
}
