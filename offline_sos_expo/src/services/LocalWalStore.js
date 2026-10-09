import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './SupabaseConfig';
import { executeNeonQuery } from './NeonConfig';

const WAL_STORAGE_KEY = '@emergency_wal_records';
const CONFIG_STORAGE_KEY = '@app_config_quick_sos';

// Event listeners for WAL updates
const walListeners = new Set();

export function subscribeWalUpdates(listener) {
  walListeners.add(listener);
  return () => walListeners.delete(listener);
}

function notifyWalListeners() {
  walListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('WAL listener error:', e);
    }
  });
}

export function normalizePhoneSender(input) {
  if (!input) return '';
  const digitsOnly = input.replace(/\D/g, '');
  if (digitsOnly.length > 10) {
    return digitsOnly.substring(digitsOnly.length - 10);
  }
  return digitsOnly.length === 0 ? input : digitsOnly;
}

export function isEmergencyProtocolMessage(body) {
  if (!body) return false;
  const clean = body.trim();
  return (
    clean.startsWith('SOS|') ||
    clean.startsWith('ALT|') ||
    clean.startsWith('ACCEPT|') ||
    clean.startsWith('RESCUED|') ||
    clean.startsWith('MEDIA|') ||
    clean.startsWith('MEDIA_PENDING|') ||
    clean.startsWith('TXT|')
  );
}

// Hybrid Logical Clock (HLC)
export class Hlc {
  constructor(physicalTime, logicalCounter, nodeId) {
    this.physicalTime = physicalTime;
    this.logicalCounter = logicalCounter;
    this.nodeId = nodeId;
  }

  static now(nodeId = 'DEVICE_NODE_1', lastSeen = null) {
    const now = Date.now();
    if (!lastSeen) {
      return new Hlc(now, 0, nodeId);
    }
    const maxPhysical = Math.max(now, lastSeen.physicalTime);
    const nextCounter =
      maxPhysical === lastSeen.physicalTime ? lastSeen.logicalCounter + 1 : 0;
    return new Hlc(maxPhysical, nextCounter, nodeId);
  }

  pack() {
    return `${this.physicalTime}:${this.logicalCounter}:${this.nodeId}`;
  }

  static unpack(packedString) {
    const parts = packedString.split(':');
    if (parts.length >= 3) {
      return new Hlc(parseInt(parts[0], 10), parseInt(parts[1], 10), parts[2]);
    }
    return new Hlc(Date.now(), 0, 'NODE');
  }
}

export class LocalWalStore {
  static async saveQuickSosNumber(number) {
    try {
      await AsyncStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ quick_sos_number: number }));
    } catch (e) {
      console.error('Config save error:', e);
    }
  }

  static async getQuickSosNumber() {
    try {
      const dataStr = await AsyncStorage.getItem(CONFIG_STORAGE_KEY);
      if (dataStr) {
        const data = JSON.parse(dataStr);
        return data.quick_sos_number || '';
      }
    } catch (e) {
      console.error('Config read error:', e);
    }
    return '';
  }

  static async insertRecord({ hlc, sender, payload, isMe, localMediaPath = '' }) {
    try {
      const records = await this.readAllRecords();

      // Handle ACK packet status updates
      if (payload && payload.startsWith('ACK|')) {
        const parts = payload.split('|');
        const ackTargetId = parts[1];
        let ackFound = false;

        for (const rec of records) {
          if (
            rec.hlc === ackTargetId ||
            (rec.payload && rec.payload.includes(ackTargetId))
          ) {
            rec.status = 'ACKNOWLEDGED';
            ackFound = true;
          }
        }
        if (ackFound) {
          await AsyncStorage.setItem(WAL_STORAGE_KEY, JSON.stringify(records));
          notifyWalListeners();
          return;
        }
      }

      // Check duplicates except for ALT location updates
      if (!payload.startsWith('ALT|')) {
        const exists = records.some(
          (rec) =>
            (hlc && rec.hlc === hlc) ||
            rec.payload === payload
        );
        if (exists) return;
      }

      const recordMap = {
        hlc: hlc || `${Date.now()}:0:NODE`,
        sender,
        payload,
        is_me: isMe ? 1 : 0,
        status: isMe ? 'PENDING' : 'RECEIVED',
        local_media_path: localMediaPath || '',
        timestamp: Date.now(),
      };

      records.push(recordMap);
      await AsyncStorage.setItem(WAL_STORAGE_KEY, JSON.stringify(records));
      notifyWalListeners();
    } catch (e) {
      console.error('❌ WAL WRITE ERROR:', e);
    }
  }

  static async readAllRecords() {
    try {
      const jsonStr = await AsyncStorage.getItem(WAL_STORAGE_KEY);
      if (!jsonStr) return [];
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('WAL read error:', e);
      return [];
    }
  }

  static async syncPendingToSupabase() {
    try {
      const records = await this.readAllRecords();
      if (!records || records.length === 0) return 0;

      let syncedCount = 0;
      let hasChanges = false;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (record.status === 'PENDING') {
          try {
            let payloadStr = String(record.payload);
            const localPath = record.local_media_path || '';

            // Handle MEDIA_PENDING uploading to Supabase Storage
            if (payloadStr.startsWith('MEDIA_PENDING|') && localPath) {
              try {
                // Fetch binary blob or base64 from file path
                const response = await fetch(localPath);
                const blob = await response.blob();
                const fileExt = localPath.split('.').pop() || 'jpg';
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `emergency_uploads/${fileName}`;

                const { error: uploadError } = await supabase.storage
                  .from('emergency-media')
                  .upload(filePath, blob);

                if (!uploadError) {
                  const { data } = supabase.storage
                    .from('emergency-media')
                    .getPublicUrl(filePath);

                  const parts = payloadStr.split('|');
                  const sessionId = parts.length > 1 ? parts[1] : 'S_SYNC';
                  payloadStr = `MEDIA|${sessionId}|${data.publicUrl}`;
                  record.payload = payloadStr;
                }
              } catch (mediaErr) {
                console.warn('Media upload retry scheduled later:', mediaErr);
              }
            }

            let currentStatus = 'SOS';
            if (payloadStr.startsWith('ACCEPT|')) currentStatus = 'ACCEPTED';
            if (payloadStr.startsWith('RESCUED|')) currentStatus = 'RESCUED';
            if (payloadStr.startsWith('MEDIA|')) currentStatus = 'MEDIA';
            if (payloadStr.startsWith('TXT|')) currentStatus = 'CHAT';

            const parts = payloadStr.split('|');
            const victimLoc =
              parts.length >= 4 && (parts[0] === 'SOS' || parts[0] === 'ALT')
                ? `${parts[2]}, ${parts[3]}`
                : null;

            executeNeonQuery(
              `INSERT INTO emergency_wal_logs (hlc_timestamp, sender, payload, status, victim_location) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (hlc_timestamp) DO NOTHING;`,
              [
                String(record.hlc),
                String(record.sender),
                payloadStr,
                currentStatus,
                victimLoc,
              ]
            );

            const { error: upsertErr } = await supabase
              .from('emergency_wal_logs')
              .upsert(
                {
                  hlc_timestamp: String(record.hlc),
                  sender: String(record.sender),
                  payload: payloadStr,
                  status: currentStatus,
                  victim_location: victimLoc,
                },
                { onConflict: 'hlc_timestamp' }
              );

            if (!upsertErr) {
              record.status = 'SYNCED';
              syncedCount++;
              hasChanges = true;
            }
          } catch (rowErr) {
            console.warn('Sync row exception:', rowErr);
          }
        }
      }

      if (hasChanges) {
        await AsyncStorage.setItem(WAL_STORAGE_KEY, JSON.stringify(records));
        notifyWalListeners();
      }

      return syncedCount;
    } catch (e) {
      console.error('Sync execution error:', e);
      return 0;
    }
  }

  static async clearAll() {
    try {
      await AsyncStorage.setItem(WAL_STORAGE_KEY, JSON.stringify([]));
      await AsyncStorage.removeItem(WAL_STORAGE_KEY);
      notifyWalListeners();
      try {
        const { sirenService } = require('./SirenService');
        if (sirenService) sirenService.stopSiren();
      } catch (_) {}
    } catch (e) {
      console.error('Error clearing WAL:', e);
    }
  }
}
