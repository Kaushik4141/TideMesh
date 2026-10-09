import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export function BroadcastSosModal({ visible, onClose, onSendSos }) {
  const [targetType, setTargetType] = useState('HOSPITAL');
  const [customPhone, setCustomPhone] = useState('');
  const [lat, setLat] = useState('Fetching live GPS...');
  const [long, setLong] = useState('Fetching live GPS...');
  const [medicalInfo, setMedicalInfo] = useState('BLEEDING | BLOOD: O+');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const presets = {
    HOSPITAL: '108',
    POLICE: '100',
    FIRE: '101',
    OTHER: '',
  };

  useEffect(() => {
    if (visible) {
      fetchLocation();
    }
  }, [visible]);

  const fetchLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLat(pos.coords.latitude.toFixed(6));
        setLong(pos.coords.longitude.toFixed(6));
      } else {
        setLat('12.971600');
        setLong('77.594600');
      }
    } catch (e) {
      setLat('12.971600');
      setLong('77.594600');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleBroadcast = () => {
    const recipient =
      targetType === 'OTHER' ? customPhone.trim() : presets[targetType];

    if (!recipient) {
      alert('Please select or enter a recipient phone number.');
      return;
    }

    const newSessionId = `S${Date.now().toString().substring(5)}`;
    const msgId = `RG-A${Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()}`;
    const payload = `SOS|${newSessionId}|${lat}|${long}|TARGET:${targetType} - ${medicalInfo.trim().toUpperCase()}|CRITICAL|10|${msgId}|DEV-1042`;

    onSendSos(recipient, payload);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Broadcast SOS Emergency Alert</Text>
            <TouchableOpacity onPress={fetchLocation} disabled={isFetchingLocation}>
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color="#69F0AE" />
              ) : (
                <Ionicons name="navigate-circle" size={26} color="#69F0AE" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Select Emergency Target:</Text>

          {/* Preset Buttons Grid */}
          <View style={styles.grid}>
            <TouchableOpacity
              style={[
                styles.gridTile,
                targetType === 'HOSPITAL' && styles.selectedTile,
              ]}
              onPress={() => setTargetType('HOSPITAL')}
            >
              <Ionicons
                name="medical"
                size={18}
                color={targetType === 'HOSPITAL' ? '#FFAB40' : '#888'}
              />
              <Text
                style={[
                  styles.tileText,
                  targetType === 'HOSPITAL' && styles.selectedTileText,
                ]}
              >
                Hospital (108)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gridTile,
                targetType === 'POLICE' && styles.selectedTile,
              ]}
              onPress={() => setTargetType('POLICE')}
            >
              <Ionicons
                name="shield"
                size={18}
                color={targetType === 'POLICE' ? '#FFAB40' : '#888'}
              />
              <Text
                style={[
                  styles.tileText,
                  targetType === 'POLICE' && styles.selectedTileText,
                ]}
              >
                Police (100)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gridTile,
                targetType === 'FIRE' && styles.selectedTile,
              ]}
              onPress={() => setTargetType('FIRE')}
            >
              <Ionicons
                name="flame"
                size={18}
                color={targetType === 'FIRE' ? '#FFAB40' : '#888'}
              />
              <Text
                style={[
                  styles.tileText,
                  targetType === 'FIRE' && styles.selectedTileText,
                ]}
              >
                Fire Dept (101)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gridTile,
                targetType === 'OTHER' && styles.selectedTile,
              ]}
              onPress={() => setTargetType('OTHER')}
            >
              <Ionicons
                name="call"
                size={18}
                color={targetType === 'OTHER' ? '#FFAB40' : '#888'}
              />
              <Text
                style={[
                  styles.tileText,
                  targetType === 'OTHER' && styles.selectedTileText,
                ]}
              >
                Custom Number
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Phone Number Field */}
          {targetType === 'OTHER' && (
            <TextInput
              style={styles.input}
              placeholder="Enter Phone Number Manually"
              placeholderTextColor="#777"
              keyboardType="phone-pad"
              value={customPhone}
              onChangeText={setCustomPhone}
            />
          )}

          {/* Coordinates Inputs */}
          <View style={styles.coordsRow}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={lat}
              onChangeText={setLat}
              placeholder="Live Lat"
              placeholderTextColor="#777"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={long}
              onChangeText={setLong}
              placeholder="Live Long"
              placeholderTextColor="#777"
            />
          </View>

          {/* Medical Info */}
          <TextInput
            style={styles.input}
            value={medicalInfo}
            onChangeText={setMedicalInfo}
            placeholder="Medical Info & Alert Details"
            placeholderTextColor="#777"
          />

          {/* Broadcast Action Button */}
          <TouchableOpacity style={styles.broadcastBtn} onPress={handleBroadcast}>
            <Ionicons name="warning" size={20} color="#FFF" />
            <Text style={styles.broadcastBtnText}>BROADCAST SOS EMERGENCY</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E1E2C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FF5252',
    fontWeight: 'bold',
    fontSize: 18,
  },
  sectionLabel: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  gridTile: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    gap: 8,
  },
  selectedTile: {
    backgroundColor: 'rgba(255, 111, 0, 0.25)',
    borderColor: '#FF6F00',
  },
  tileText: {
    color: '#AAA',
    fontSize: 12,
  },
  selectedTileText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 12,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  broadcastBtn: {
    backgroundColor: '#FF5252',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  broadcastBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: '#AAA',
  },
});
