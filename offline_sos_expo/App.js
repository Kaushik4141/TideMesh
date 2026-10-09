import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView as RNSafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

let SafeAreaProvider = React.Fragment;
let SafeAreaView = RNSafeAreaView || View;

try {
  const SafeAreaContext = require('react-native-safe-area-context');
  if (SafeAreaContext.SafeAreaProvider) SafeAreaProvider = SafeAreaContext.SafeAreaProvider;
  if (SafeAreaContext.SafeAreaView) SafeAreaView = SafeAreaContext.SafeAreaView;
} catch (e) {
  // Fallback to React Native builtin SafeAreaView
}

import { supabase, getSharedRealtimeChannel } from './src/services/SupabaseConfig';
import {
  LocalWalStore,
  subscribeWalUpdates,
  normalizePhoneSender,
  isEmergencyProtocolMessage,
  Hlc,
} from './src/services/LocalWalStore';
import { ParsedPacket } from './src/models/ParsedPacket';
import { FirstAidEngine } from './src/services/FirstAidEngine';
import { sirenService } from './src/services/SirenService';
import { SmsTransport, subscribeSmsEvents } from './src/services/SmsTransport';
import { BleMeshTransport, subscribeBleEvents } from './src/services/BleMeshTransport';
import { LocalMeshTransport, subscribeLocalMeshEvents } from './src/services/LocalMeshTransport';

import { ThreadedHospitalCard } from './src/components/ThreadedHospitalCard';
import { FirstAidChatbotModal } from './src/components/FirstAidChatbotModal';
import { BroadcastSosModal } from './src/components/BroadcastSosModal';
import { QuickSosCountdownModal } from './src/components/QuickSosCountdownModal';
import { WalDebugModal } from './src/components/WalDebugModal';
import { MapScreenModal } from './src/components/MapScreenModal';
import { SimulatorPanel } from './src/components/SimulatorPanel';

// Error Boundary to catch render exceptions safely
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorInfo: error ? error.toString() : 'Unknown Error' };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('App Error Boundary caught exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={54} color="#FF5252" />
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 12 }}>
            App Exception Intercepted
          </Text>
          <Text style={{ color: '#AAA', fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 20 }}>
            {this.state.errorInfo}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#0288D1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Reload Interface</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// Singleton instance of First Aid AI Engine
const aiEngine = new FirstAidEngine();

export default function App() {
  const [packets, setPackets] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [showHistoryArchive, setShowHistoryArchive] = useState(false);
  const [presetQuickNumber, setPresetQuickNumber] = useState('');
  const [currentLat, setCurrentLat] = useState(null);
  const [currentLng, setCurrentLng] = useState(null);

  // Modals
  const [showFirstAidModal, setShowFirstAidModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showQuickSosModal, setShowQuickSosModal] = useState(false);
  const [showWalModal, setShowWalModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapParams, setMapParams] = useState({
    sessionId: '',
    partnerPhone: '',
    label: '',
    isSelfSent: false,
  });

  const latestHlcRef = useRef(null);

  useEffect(() => {
    // 0. Ensure no leftover vibration running on app launch
    sirenService.stopSiren();

    // 1. Initialize AI Model
    aiEngine.loadModel();

    // 2. Request Permissions
    requestPermissions();

    // 3. Load WAL Storage & Config
    loadWalFromStorage();
    loadPresetQuickNumber();

    // 4. Subscribe WAL updates
    const unsubscribeWal = subscribeWalUpdates(() => {
      loadWalFromStorage();
    });

    // 5. Subscribe SMS events (handles mesh relay distribution & incoming packets)
    const unsubscribeSms = subscribeSmsEvents((event) => {
      if (event.type === 'INCOMING') {
        handleIncomingMessage(event.sender, event.message, { isSentByMe: false });
      } else if (event.type === 'OUTGOING') {
        handleIncomingMessage(event.to || 'RESCUER_NODE', event.message, { isSentByMe: true });
      }
    });

    // 5b. Subscribe BLE Mesh events
    const unsubscribeBle = subscribeBleEvents((event) => {
      if (event.type === 'INCOMING') {
        handleIncomingMessage(event.senderNodeId || 'BLE_NODE', event.payload, { isSentByMe: false });
      } else if (event.type === 'OUTGOING') {
        handleIncomingMessage(event.targetNode || 'BLE_NODE', event.payload, { isSentByMe: true });
      }
    });

    // 5c. Subscribe Local P2P Mesh events
    const unsubscribeLocalMesh = subscribeLocalMeshEvents((event) => {
      if (event.type === 'INCOMING') {
        handleIncomingMessage(event.sender || 'LOCAL_P2P', event.payload, { isSentByMe: false });
      } else if (event.type === 'OUTGOING') {
        handleIncomingMessage(event.sender || 'LOCAL_P2P', event.payload, { isSentByMe: true });
      }
    });

    // 6. Timers for periodic file watching & cloud auto-sync
    const watcherTimer = setInterval(() => {
      loadWalFromStorage();
    }, 2000);

    const autoSyncTimer = setInterval(() => {
      if (isOnline) {
        triggerCloudSync();
      }
    }, 3000);

    // 7. Supabase Realtime Subscription (Postgres DB Changes + Instant WebSocket Broadcasts)
    let realtimeSub = null;
    try {
      realtimeSub = getSharedRealtimeChannel()
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'emergency_wal_logs' },
          (payload) => {
            if (payload.new) {
              const row = payload.new;
              const sender = row.sender || '';
              const payloadStr = row.payload || '';
              const isMe = row.is_me === 1;

              if (payloadStr && isEmergencyProtocolMessage(payloadStr)) {
                handleIncomingMessage(sender, payloadStr, { isSentByMe: isMe });
              }
            }
          }
        )
        .on('broadcast', { event: 'sos_alert' }, (data) => {
          if (data && data.payload) {
            const { sender, payload: payloadStr, isSentByMe: isMeFlag } = data.payload;
            if (payloadStr && isEmergencyProtocolMessage(payloadStr)) {
              handleIncomingMessage(sender, payloadStr, { isSentByMe: !!isMeFlag });
            }
          }
        })
        .on('broadcast', { event: 'ble_mesh_packet' }, (data) => {
          if (data && data.payload) {
            const { senderNodeId, payload: payloadStr } = data.payload;
            if (senderNodeId && senderNodeId !== BleMeshTransport.getLocalNodeId()) {
              BleMeshTransport.handleIncomingBlePacket({ senderNodeId, payload: payloadStr });
            }
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription notice:', e);
    }

    return () => {
      unsubscribeWal();
      unsubscribeSms();
      unsubscribeBle();
      unsubscribeLocalMesh();
      clearInterval(watcherTimer);
      clearInterval(autoSyncTimer);
      if (realtimeSub) supabase.removeChannel(realtimeSub);
    };
  }, [isOnline]);

  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        const pos = await Location.getCurrentPositionAsync({});
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
      }
    } catch (e) {
      console.warn('Location permission notice:', e);
    }
  };

  const loadPresetQuickNumber = async () => {
    const num = await LocalWalStore.getQuickSosNumber();
    setPresetQuickNumber(num);
  };

  const loadWalFromStorage = async () => {
    try {
      const entries = await LocalWalStore.readAllRecords();
      const loadedPackets = [];

      for (const entry of entries) {
        const sender = entry.sender || 'Unknown';
        const payload = entry.payload || '';
        const isMe = (entry.is_me || 0) === 1;

        if (isEmergencyProtocolMessage(payload)) {
          loadedPackets.unshift(
            ParsedPacket.fromString({
              sender,
              rawBody: payload,
              isSentByMe: isMe,
              localMediaPath: entry.local_media_path || '',
            })
          );
        }
      }

      setPackets(loadedPackets);
      checkActiveAlarms(loadedPackets);
    } catch (e) {
      console.error('Error loading WAL storage:', e);
    }
  };

  const groupPacketsBySession = (packetList = packets) => {
    const sessionGroups = {};
    for (const packet of packetList) {
      const key = packet.sessionId || normalizePhoneSender(packet.sender);

      if (!sessionGroups[key]) sessionGroups[key] = [];
      sessionGroups[key].push(packet);
    }
    return sessionGroups;
  };

  const checkActiveAlarms = (packetList = packets) => {
    const sessions = groupPacketsBySession(packetList);
    let hasPendingUnacceptedSos = false;

    for (const sessionPackets of Object.values(sessions)) {
      const isRescued = sessionPackets.some((p) => p.type === 'RESCUED');
      const isAccepted = sessionPackets.some((p) => p.type === 'ACCEPT');
      // Sirens/vibration ONLY trigger for incoming unaccepted SOS packets (sent by victim, received by rescuer)
      const isIncomingSos = sessionPackets.some(
        (p) => !p.isSentByMe && p.type === 'SOS'
      );

      if (isIncomingSos && !isAccepted && !isRescued) {
        hasPendingUnacceptedSos = true;
        break;
      }
    }

    if (!hasPendingUnacceptedSos) {
      stopSiren();
    } else if (hasPendingUnacceptedSos && !isAlarmPlaying) {
      startSiren();
    }
  };

  const startSiren = () => {
    setIsAlarmPlaying(true);
    sirenService.startSiren();
  };

  const stopSiren = () => {
    sirenService.stopSiren();
    setIsAlarmPlaying(false);
  };

  const handleIncomingMessage = async (
    sender,
    body,
    { isSentByMe = false, localMediaPath = '' } = {}
  ) => {
    if (!body || !isEmergencyProtocolMessage(body)) return;

    const cleanSender = normalizePhoneSender(sender);

    try {
      latestHlcRef.current = Hlc.now('DEVICE_NODE_1', latestHlcRef.current);
      await LocalWalStore.insertRecord({
        hlc: latestHlcRef.current.pack(),
        sender: cleanSender,
        payload: body,
        isMe: isSentByMe,
        localMediaPath,
      });
    } catch (e) {
      console.error('WAL Insert error:', e);
    }

    await loadWalFromStorage();

    if (isOnline) {
      LocalWalStore.syncPendingToSupabase();
    }
  };

  const triggerCloudSync = async () => {
    const synced = await LocalWalStore.syncPendingToSupabase();
    await loadWalFromStorage();
  };

  const handleBroadcastSos = (recipient, payload) => {
    SmsTransport.sendSms(recipient, payload);
    LocalMeshTransport.broadcastLocal(payload, recipient);
    BleMeshTransport.broadcastPacket(payload, recipient);
    handleIncomingMessage(recipient, payload, { isSentByMe: true });
    Alert.alert('🚨 Emergency SOS Sent!', `Broadcasted to ${recipient}`);
  };

  const handleQuickSosTap = () => {
    if (!presetQuickNumber) {
      Alert.prompt(
        'Preset Quick SOS Contact',
        'Enter default mobile phone number for instant 1-tap emergency broadcast:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: async (num) => {
              if (num && num.trim()) {
                await LocalWalStore.saveQuickSosNumber(num.trim());
                setPresetQuickNumber(num.trim());
              }
            },
          },
        ],
        'plain-text',
        presetQuickNumber
      );
      return;
    }

    setShowQuickSosModal(true);
  };

  const dispatchQuickSosPayload = async () => {
    let latStr = currentLat ? currentLat.toFixed(6) : '12.971600';
    let longStr = currentLng ? currentLng.toFixed(6) : '77.594600';

    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      latStr = pos.coords.latitude.toFixed(6);
      longStr = pos.coords.longitude.toFixed(6);
    } catch (_) {}

    const newSessionId = `S${Date.now().toString().substring(5)}`;
    const msgId = `RG-A${Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()}`;
    const payload = `SOS|${newSessionId}|${latStr}|${longStr}|QUICK ONE-TAP CRITICAL EMERGENCY ALERT|CRITICAL|10|${msgId}|DEV-1042`;

    SmsTransport.sendSms(presetQuickNumber, payload);
    LocalMeshTransport.broadcastLocal(payload, presetQuickNumber);
    BleMeshTransport.broadcastPacket(payload, presetQuickNumber);
    handleIncomingMessage(presetQuickNumber, payload, { isSentByMe: true });
    setShowQuickSosModal(false);
    Alert.alert('⚡ QUICK SOS BROADCASTED', `Sent to ${presetQuickNumber}`);
  };

  const acceptEmergencyMission = async (senderPhone, sessionId) => {
    stopSiren();

    let myLat = currentLat ? currentLat.toFixed(6) : '12.971600';
    let myLng = currentLng ? currentLng.toFixed(6) : '77.594600';

    try {
      const pos = await Location.getCurrentPositionAsync({});
      myLat = pos.coords.latitude.toFixed(6);
      myLng = pos.coords.longitude.toFixed(6);
    } catch (_) {}

    const acceptPayload = `ACCEPT|${sessionId}|${myLat}|${myLng}|Rescue Ambulance Dispatched`;

    SmsTransport.sendSms(senderPhone, acceptPayload);
    LocalMeshTransport.broadcastLocal(acceptPayload, senderPhone);
    BleMeshTransport.broadcastPacket(acceptPayload, senderPhone);
    handleIncomingMessage(senderPhone, acceptPayload, { isSentByMe: true });
    Alert.alert('Mission Accepted!', 'Rescue ambulance dispatched notification sent.');
  };

  const markAsRescued = (senderPhone, sessionId) => {
    stopSiren();
    const rescuePayload = `RESCUED|${sessionId}|0.0|0.0|Victim Has Been Successfully Rescued`;

    SmsTransport.sendSms(senderPhone, rescuePayload);
    LocalMeshTransport.broadcastLocal(rescuePayload, senderPhone);
    BleMeshTransport.broadcastPacket(rescuePayload, senderPhone);
    handleIncomingMessage(senderPhone, rescuePayload, { isSentByMe: true });
    Alert.alert('🎉 VICTIM MARKED AS RESCUED!', 'Incident moved to History archive.');
  };

  const openInAppMap = (sessionId, partnerPhone, label, isSelfSent) => {
    setMapParams({ sessionId, partnerPhone, label, isSelfSent });
    setShowMapModal(true);
  };

  const openExternalMap = (lat, lng) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`);
    });
  };

  const captureAndQueueMedia = async (recipientPhone, sessionId, uri, isVideo) => {
    const pendingPayload = `MEDIA_PENDING|${sessionId}|${uri}`;
    await handleIncomingMessage(recipientPhone, pendingPayload, {
      isSentByMe: true,
      localMediaPath: uri,
    });
  };

  // Divide sessions into Active and History
  const allSessions = groupPacketsBySession();
  const activeSessions = {};
  const historySessions = {};

  Object.entries(allSessions).forEach(([key, thread]) => {
    const isRescued = thread.some((p) => p.type === 'RESCUED');
    if (isRescued) {
      historySessions[key] = thread;
    } else {
      activeSessions[key] = thread;
    }
  });

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E1E2C" />

        {/* Header Bar */}
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>OffGrid SOS</Text>
          <View style={styles.appBarActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowFirstAidModal(true)}
            >
              <Ionicons name="hardware-chip-outline" size={22} color="#64FFDA" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowWalModal(true)}
            >
              <Ionicons name="bug-outline" size={22} color="#FFAB40" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowSimulatorModal(true)}
            >
              <Ionicons name="options-outline" size={22} color="#FF5252" />
            </TouchableOpacity>

            <View style={styles.statusBadge}>
              <Ionicons
                name={permissionGranted ? 'radio' : 'radio-outline'}
                size={14}
                color={permissionGranted ? '#69F0AE' : '#FF5252'}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: permissionGranted ? '#69F0AE' : '#FF5252' },
                ]}
              >
                {permissionGranted ? 'Active' : 'No Access'}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: 'rgba(41, 182, 246, 0.15)' }]}>
              <Ionicons name="bluetooth" size={13} color="#29B6F6" />
              <Text style={[styles.statusBadgeText, { color: '#29B6F6' }]}>
                BLE Mesh
              </Text>
            </View>
          </View>
        </View>

        {/* Cloud Sync Status Banner */}
        <View
          style={[
            styles.syncBanner,
            {
              backgroundColor: isOnline
                ? 'rgba(76, 175, 80, 0.15)'
                : 'rgba(255, 152, 0, 0.15)',
              borderColor: isOnline ? '#388E3C' : '#F57C00',
            },
          ]}
        >
          <Ionicons
            name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={16}
            color={isOnline ? '#69F0AE' : '#FFAB40'}
          />
          <Text
            style={[
              styles.syncBannerText,
              { color: isOnline ? '#69F0AE' : '#FFAB40' },
            ]}
          >
            {isOnline
              ? 'Supabase Live • Realtime Engine Active (2G/LTE)'
              : 'Offline Mode • Saved Locally in File Store'}
          </Text>
          {isOnline && (
            <TouchableOpacity onPress={triggerCloudSync}>
              <Text style={styles.syncNowText}>Sync Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Emergency Siren Active Banner */}
        {isAlarmPlaying && (
          <View style={styles.sirenBanner}>
            <Ionicons name="notifications" size={22} color="#FFF" />
            <Text style={styles.sirenBannerText}>EMERGENCY SIREN RINGING</Text>
            <TouchableOpacity style={styles.muteBtn} onPress={stopSiren}>
              <Text style={styles.muteBtnText}>Mute</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content List */}
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 100 }}>
          {Object.keys(activeSessions).length === 0 &&
            Object.keys(historySessions).length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="shield-outline" size={48} color="#555" />
                <Text style={styles.emptyStateText}>No emergency requests yet.</Text>
              </View>
            )}

          {/* Active Emergency Missions */}
          {Object.keys(activeSessions).length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Active Emergency Missions</Text>
              {Object.entries(activeSessions).map(([key, thread]) => {
                if (!thread || thread.length === 0) return null;

                const sosPacket =
                  [...thread].reverse().find((p) => p.type === 'SOS' || p.type === 'ALT') ||
                  thread[0];

                if (!sosPacket) return null;

                const isSelfSentSOS = sosPacket.isSentByMe;
                const currentSessionId = sosPacket.sessionId || `RG-${key}`;

                let partnerPhone = '';
                if (isSelfSentSOS) {
                  const acceptPkt = thread.find((p) => p.type === 'ACCEPT');
                  partnerPhone = acceptPkt
                    ? normalizePhoneSender(acceptPkt.sender)
                    : '';
                } else {
                  partnerPhone = normalizePhoneSender(sosPacket.sender);
                }

                const locationPacket =
                  thread.find(
                    (p) =>
                      (p.type === 'SOS' || p.type === 'ALT') && p.hasCoordinates
                  ) || thread[0];

                const acceptPacket = thread.find((p) => p.type === 'ACCEPT');
                const hasAcceptance = thread.some((p) => p.type === 'ACCEPT');

                const distance =
                  locationPacket && typeof locationPacket.getDistanceTo === 'function'
                    ? locationPacket.getDistanceTo(currentLat, currentLng)
                    : 0.0;
                const estMins = Math.round(distance * 2.5);

                return (
                  <ThreadedHospitalCard
                    key={key}
                    senderPhone={
                      partnerPhone || normalizePhoneSender(sosPacket.sender)
                    }
                    sessionId={currentSessionId}
                    packets={thread}
                    locationPacket={locationPacket}
                    acceptPacket={hasAcceptance ? acceptPacket : null}
                    hasAcceptance={hasAcceptance}
                    isRescued={false}
                    isSelfSent={isSelfSentSOS}
                    distance={distance}
                    estMins={estMins}
                    currentLat={currentLat}
                    currentLng={currentLng}
                    onAccept={() =>
                      acceptEmergencyMission(
                        normalizePhoneSender(sosPacket.sender),
                        currentSessionId
                      )
                    }
                    onRescued={() =>
                      markAsRescued(
                        normalizePhoneSender(sosPacket.sender),
                        currentSessionId
                      )
                    }
                    onOpenInAppMap={(sId, pPhone, lbl) =>
                      openInAppMap(sId, pPhone, lbl, isSelfSentSOS)
                    }
                    onOpenExternalMap={openExternalMap}
                    onSendMessage={(msgText) => {
                      const target =
                        partnerPhone || normalizePhoneSender(sosPacket.sender);
                      const payload = currentSessionId
                        ? `TXT|${currentSessionId}|${msgText}`
                        : msgText;
                      SmsTransport.sendSms(target, payload);
                      handleIncomingMessage(target, payload, { isSentByMe: true });
                    }}
                    onCaptureMedia={(uri, isVideo) =>
                      captureAndQueueMedia(
                        partnerPhone || normalizePhoneSender(sosPacket.sender),
                        currentSessionId,
                        uri,
                        isVideo
                      )
                    }
                  />
                );
              })}
            </View>
          )}

          {/* Rescued Incident History Archive */}
          {Object.keys(historySessions).length > 0 && (
            <View style={{ marginTop: 16 }}>
              <TouchableOpacity
                style={styles.archiveHeader}
                onPress={() => setShowHistoryArchive(!showHistoryArchive)}
              >
                <Text style={styles.archiveTitle}>
                  Rescued Incident History ({Object.keys(historySessions).length})
                </Text>
                <Ionicons
                  name={showHistoryArchive ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64FFDA"
                />
              </TouchableOpacity>

              {showHistoryArchive &&
                Object.entries(historySessions).map(([key, thread]) => {
                  if (!thread || thread.length === 0) return null;

                  const sosPacket =
                    [...thread].reverse().find((p) => p.type === 'SOS' || p.type === 'ALT') ||
                    thread[0];

                  if (!sosPacket) return null;

                  const locationPacket =
                    thread.find((p) => p.hasCoordinates) || thread[0];

                  return (
                    <ThreadedHospitalCard
                      key={key}
                      senderPhone={normalizePhoneSender(sosPacket.sender)}
                      sessionId={sosPacket.sessionId}
                      packets={thread}
                      locationPacket={locationPacket}
                      hasAcceptance={true}
                      isRescued={true}
                      isSelfSent={sosPacket.isSentByMe}
                      distance={0}
                      estMins={0}
                      currentLat={currentLat}
                      currentLng={currentLng}
                      onAccept={() => {}}
                      onRescued={() => {}}
                      onOpenInAppMap={(sId, pPhone, lbl) =>
                        openInAppMap(sId, pPhone, lbl, sosPacket.isSentByMe)
                      }
                      onOpenExternalMap={openExternalMap}
                      onSendMessage={() => {}}
                      onCaptureMedia={(uri, isVideo) =>
                        captureAndQueueMedia(
                          normalizePhoneSender(sosPacket.sender),
                          sosPacket.sessionId,
                          uri,
                          isVideo
                        )
                      }
                    />
                  );
                })}
            </View>
          )}
        </ScrollView>

        {/* Floating Action Buttons */}
        <View style={styles.fabRow}>
          <TouchableOpacity
            style={styles.quickSosFab}
            onPress={handleQuickSosTap}
          >
            <Ionicons name="flash" size={28} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.rightFabs}>
            <TouchableOpacity
              style={styles.aiFab}
              onPress={() => setShowFirstAidModal(true)}
            >
              <Ionicons name="hardware-chip" size={18} color="#FFF" />
              <Text style={styles.fabText}>First Aid AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosFab}
              onPress={() => setShowBroadcastModal(true)}
            >
              <Ionicons name="warning" size={18} color="#FFF" />
              <Text style={styles.fabText}>Send SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modals */}
        <FirstAidChatbotModal
          visible={showFirstAidModal}
          onClose={() => setShowFirstAidModal(false)}
          engine={aiEngine}
        />

        <BroadcastSosModal
          visible={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
          onSendSos={handleBroadcastSos}
        />

        <QuickSosCountdownModal
          visible={showQuickSosModal}
          presetNumber={presetQuickNumber}
          onCancel={() => setShowQuickSosModal(false)}
          onExecute={dispatchQuickSosPayload}
        />

        <WalDebugModal
          visible={showWalModal}
          onClose={() => setShowWalModal(false)}
        />

        <SimulatorPanel
          visible={showSimulatorModal}
          onClose={() => setShowSimulatorModal(false)}
        />

        <MapScreenModal
          visible={showMapModal}
          onClose={() => setShowMapModal(false)}
          {...mapParams}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E2C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3D',
  },
  appBarTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  syncBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
  },
  syncNowText: {
    color: '#69F0AE',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sirenBanner: {
    backgroundColor: '#D32F2F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    gap: 8,
  },
  sirenBannerText: {
    flex: 1,
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  muteBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  muteBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    color: '#777',
    marginTop: 12,
    fontSize: 14,
  },
  sectionTitle: {
    color: '#FF5252',
    fontWeight: 'bold',
    fontSize: 14,
    marginVertical: 8,
  },
  archiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  archiveTitle: {
    color: '#64FFDA',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fabRow: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickSosFab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#B71C1C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF5252',
    shadowColor: '#FF5252',
    shadowRadius: 10,
    shadowOpacity: 0.6,
  },
  rightFabs: {
    flexDirection: 'row',
    gap: 8,
  },
  aiFab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00796B',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  sosFab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5252',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  fabText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
