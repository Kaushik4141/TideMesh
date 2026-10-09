import { LocalWalStore, normalizePhoneSender, isEmergencyProtocolMessage } from './LocalWalStore';
import { BleMeshTransport } from './BleMeshTransport';

const localListeners = new Set();
const peerIps = new Set();

export function subscribeLocalMeshEvents(listener) {
  localListeners.add(listener);
  return () => localListeners.delete(listener);
}

function notifyLocalListeners(event) {
  localListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (e) {
      console.error('Local Mesh listener error:', e);
    }
  });
}

export class LocalMeshTransport {
  static addPeerIp(ip) {
    if (ip && ip.trim()) {
      peerIps.add(ip.trim());
    }
  }

  static getPeerIps() {
    return Array.from(peerIps);
  }

  /**
   * Broadcasts SOS payload across local LAN IP peers & Bluetooth Mesh
   */
  static async broadcastLocal(payload, senderPhone = 'LOCAL_NODE') {
    console.log(`[LOCAL P2P MESH BROADCAST] payload: ${payload}`);

    // 1. Notify local app subscribers
    notifyLocalListeners({
      type: 'OUTGOING',
      sender: senderPhone,
      payload,
      timestamp: Date.now(),
    });

    // 2. Broadcast via BLE Mesh
    try {
      BleMeshTransport.broadcastPacket(payload, senderPhone);
    } catch (e) {
      console.warn('BLE Broadcast notice:', e);
    }

    // 3. Dispatch to registered local network peer IPs over HTTP POST
    const targets = Array.from(peerIps);
    for (const ip of targets) {
      try {
        const url = ip.startsWith('http') ? `${ip}/api/sos` : `http://${ip}:8080/api/sos`;
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: senderPhone, payload }),
        }).catch(() => {});
      } catch (_) {}
    }
  }

  /**
   * Called when an incoming local SOS packet is received
   */
  static async handleIncomingLocalPacket(sender, payload) {
    if (!payload || !isEmergencyProtocolMessage(payload)) return;

    console.log(`[LOCAL P2P MESH INCOMING] from: ${sender} -> payload: ${payload}`);

    notifyLocalListeners({
      type: 'INCOMING',
      sender,
      payload,
      timestamp: Date.now(),
    });
  }
}
