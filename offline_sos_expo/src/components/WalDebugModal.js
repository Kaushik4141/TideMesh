import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LocalWalStore } from '../services/LocalWalStore';
import { BleMeshTransport } from '../services/BleMeshTransport';
import { LocalMeshTransport } from '../services/LocalMeshTransport';

export function WalDebugModal({ visible, onClose }) {
  const [entries, setEntries] = useState([]);
  const [peerIpInput, setPeerIpInput] = useState('');
  const [activePeers, setActivePeers] = useState([]);

  useEffect(() => {
    if (visible) {
      loadEntries();
      setActivePeers(BleMeshTransport.getDiscoveredPeers());
    }
  }, [visible]);

  const loadEntries = async () => {
    const data = await LocalWalStore.readAllRecords();
    setEntries(data || []);
  };

  const handleClear = async () => {
    await LocalWalStore.clearAll();
    setEntries([]);
    alert('✅ Local WAL Emergency Database Cleared!');
  };

  const handleAddPeerIp = () => {
    if (peerIpInput.trim()) {
      LocalMeshTransport.addPeerIp(peerIpInput.trim());
      setPeerIpInput('');
      alert(`Added LAN Peer IP: ${peerIpInput.trim()}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialogBox}>
          <Text style={styles.title}>
            Network & WAL Store Diagnostics
          </Text>

          {/* Network Health Cards */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerTitle}>
              🔵 Local BLE Mesh Node: {BleMeshTransport.getLocalNodeId()}
            </Text>
            <Text style={styles.infoBannerSub}>
              Discovered BLE Peers: {activePeers.length} node(s) in range
            </Text>
          </View>

          <View style={styles.warningBanner}>
            <Text style={styles.warningTitle}>⚠️ Supabase Cloud Status</Text>
            <Text style={styles.warningSub}>
              Project `cpqowlqxmruszognbzbn.supabase.co` DNS lookup failed (Project paused/expired). Using BLE Mesh & Local P2P Transport.
            </Text>
          </View>

          {/* Add Local LAN Peer IP */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#AAA', fontSize: 11, marginBottom: 4 }}>
              Add Local Peer IP (Hotspot / Wi-Fi Mesh):
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput
                style={styles.input}
                placeholder="e.g. 192.168.1.105"
                placeholderTextColor="#666"
                value={peerIpInput}
                onChangeText={setPeerIpInput}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddPeerIp}>
                <Text style={styles.addBtnText}>Add Peer</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            Local WAL Records ({entries.length})
          </Text>

          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No entries in local WAL store yet.</Text>
          ) : (
            <ScrollView style={styles.list}>
              {entries.map((item, idx) => {
                const isSynced = item.status === 'SYNCED';
                return (
                  <View
                    key={`${item.hlc}_${idx}`}
                    style={[
                      styles.card,
                      {
                        backgroundColor: isSynced
                          ? 'rgba(27, 94, 32, 0.3)'
                          : 'rgba(230, 81, 0, 0.3)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: isSynced ? '#69F0AE' : '#FFAB40' },
                      ]}
                    >
                      {item.sender} ({item.is_me === 1 ? 'Sent' : 'Received'}) •
                      Status: {item.status}
                    </Text>
                    <Text style={styles.cardPayload}>
                      Payload: {item.payload}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear DB</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBox: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#1E1E2C',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  infoBanner: {
    backgroundColor: 'rgba(2, 136, 209, 0.15)',
    borderColor: '#0288D1',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoBannerTitle: {
    color: '#29B6F6',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoBannerSub: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 2,
  },
  warningBanner: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderColor: '#F57C00',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  warningTitle: {
    color: '#FFAB40',
    fontWeight: 'bold',
    fontSize: 12,
  },
  warningSub: {
    color: '#CCC',
    fontSize: 10,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 6,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  addBtn: {
    backgroundColor: '#0288D1',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 6,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyText: {
    color: '#AAA',
    textAlign: 'center',
    marginVertical: 20,
  },
  list: {
    maxHeight: 220,
  },
  card: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardPayload: {
    color: '#DDD',
    fontSize: 11,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearText: {
    color: '#FF5252',
    fontWeight: 'bold',
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeText: {
    color: '#FFF',
  },
});
