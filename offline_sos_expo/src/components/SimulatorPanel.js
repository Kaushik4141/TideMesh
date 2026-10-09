import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SmsTransport } from '../services/SmsTransport';
import { BleMeshTransport } from '../services/BleMeshTransport';

export function SimulatorPanel({ visible, onClose }) {
  const [senderPhone, setSenderPhone] = useState('9876543210');
  const [customPayload, setCustomPayload] = useState(
    'SOS|S99182|12.971600|77.594600|TARGET:HOSPITAL | ACCIDENT & SEVERE BLEEDING'
  );

  const presets = [
    {
      title: '🚨 RescueGrid SOS (Snake Bite - TTL: 10)',
      sender: '9876543210',
      payload:
        'SOS|S10294|12.914100|74.856000|SNAKE_BITE|CRITICAL|10|RG-A81F29|DEV-1042',
    },
    {
      title: '🔄 WAL Multi-Hop BLE Relay (TTL: 9)',
      sender: 'BLE-NODE-7721',
      payload:
        'SOS|S10294|12.914100|74.856000|BLE_MESH_MULTI_HOP|CRITICAL|9|RG-A81F29|DEV-1042',
    },
    {
      title: '✅ Transmission ACK Received',
      sender: '9123456789',
      payload: 'ACK|RG-A81F29|DEV-RESCUER|RECEIVED',
    },
    {
      title: '🚑 Rescuer Accepts Mission',
      sender: '9123456789',
      payload: 'ACCEPT|S10294|12.975000|77.591000|Ambulance En Route',
    },
    {
      title: '📍 Victim Movement Update (ALT)',
      sender: '9876543210',
      payload:
        'ALT|S10294|12.914500|74.856500|Live Movement Update (10m+ moved)',
    },
    {
      title: '🎉 Victim Rescued (RESCUED)',
      sender: '9876543210',
      payload: 'RESCUED|S10294|0.0|0.0|Victim Safely Transported to ER',
    },
    {
      title: '💬 Incident Chat Reply (TXT)',
      sender: '9123456789',
      payload: 'TXT|S10294|Hang in there! Help is on the way.',
    },
  ];

  const handleSimulateSms = (phone, payload) => {
    SmsTransport.simulateIncomingSms(phone, payload);
    onClose();
  };

  const handleSimulateBle = (nodeId, payload) => {
    BleMeshTransport.handleIncomingBlePacket({
      senderNodeId: nodeId || 'BLE-NODE-REMOTE',
      payload,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Ionicons name="bluetooth" size={22} color="#64FFDA" />
            <Text style={styles.title}>SMS & BLE Mesh Protocol Simulator</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.subtitle}>
              Simulate receiving multi-hop SMS protocol & BLE Mesh broadcast packets from nearby victim/rescuer nodes:
            </Text>

            {presets.map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.presetCard}
                onPress={() => handleSimulateSms(preset.sender, preset.payload)}
              >
                <Text style={styles.presetTitle}>{preset.title}</Text>
                <Text style={styles.presetMeta}>
                  From: {preset.sender}
                </Text>
                <Text style={styles.presetPayload}>{preset.payload}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Custom Simulated Packet</Text>
            <TextInput
              style={styles.input}
              placeholder="Sender Phone or BLE Node ID"
              placeholderTextColor="#777"
              value={senderPhone}
              onChangeText={setSenderPhone}
            />
            <TextInput
              style={[styles.input, { height: 70 }]}
              multiline
              placeholder="Protocol Payload (SOS|..., ALT|..., ACCEPT|..., etc.)"
              placeholderTextColor="#777"
              value={customPayload}
              onChangeText={setCustomPayload}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 20 }}>
              <TouchableOpacity
                style={[styles.dispatchBtn, { flex: 1 }]}
                onPress={() => handleSimulateSms(senderPhone, customPayload)}
              >
                <Ionicons name="send-outline" size={16} color="#FFF" />
                <Text style={styles.dispatchText}>Inject SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dispatchBtn, { flex: 1, backgroundColor: '#0288D1' }]}
                onPress={() => handleSimulateBle(senderPhone, customPayload)}
              >
                <Ionicons name="bluetooth-outline" size={16} color="#FFF" />
                <Text style={styles.dispatchText}>Inject BLE Mesh</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  panel: {
    maxHeight: '80%',
    backgroundColor: '#1E1E2C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    flex: 1,
    color: '#FFAB40',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    marginTop: 12,
  },
  subtitle: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 12,
  },
  presetCard: {
    backgroundColor: 'rgba(255, 171, 64, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 171, 64, 0.3)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  presetTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  presetMeta: {
    color: '#FFAB40',
    fontSize: 10,
    marginTop: 2,
  },
  presetPayload: {
    color: '#CCC',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Platform' === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 8,
  },
  dispatchBtn: {
    backgroundColor: '#E64A19',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  dispatchText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
