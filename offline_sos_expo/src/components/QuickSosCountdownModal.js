import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function QuickSosCountdownModal({
  visible,
  presetNumber,
  onCancel,
  onExecute,
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  useEffect(() => {
    let timer = null;
    if (visible) {
      setSecondsRemaining(3);
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onExecute();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Ionicons name="warning" size={48} color="#FF5252" />
          <Text style={styles.title}>BROADCASTING QUICK SOS</Text>
          <Text style={styles.subtext}>
            Sending emergency payload to {presetNumber} in:
          </Text>

          <View style={styles.circleContainer}>
            <Text style={styles.countdownNumber}>{secondsRemaining}</Text>
          </View>

          <Text style={styles.hintText}>Tap X to cancel broadcast</Text>

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Ionicons name="close-circle" size={44} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '85%',
    backgroundColor: '#B71C1C',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF5252',
  },
  title: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  subtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  circleContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    shadowColor: '#FF5252',
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  countdownNumber: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  hintText: {
    color: '#FFAB40',
    fontSize: 11,
    marginBottom: 12,
  },
  cancelBtn: {
    marginTop: 4,
  },
});
