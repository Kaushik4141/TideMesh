import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const QUICK_PILLS = [
  { label: 'Snake Bite First Aid', query: 'My friend was bitten by a snake.' },
  { label: 'Choking Emergency', query: 'Someone is choking and cannot speak.' },
  { label: 'Heart Attack / Chest Pain', query: 'My father has severe chest pain.' },
  { label: 'Stomach Pain & Gastritis', query: 'Stomach pain and gastritis first aid.' },
  { label: 'CPR Steps', query: 'How do I perform CPR?' },
  { label: 'Severe Bleeding', query: 'Severe bleeding first aid.' },
  { label: 'Dog Bite & Rabies', query: 'Dog bite first aid.' },
  { label: 'Burn First Aid', query: 'Burn first aid.' },
];

export function FirstAidChatbotModal({ visible, onClose, engine }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (visible) {
      if (!engine.isLoaded) {
        engine.loadModel();
      }
      if (messages.length === 0) {
        setMessages([
          {
            text: 'Hello! I am your 100% Offline AI Emergency First Aid Assistant covering 25 emergency categories. Describe what happened or select a topic below.',
            isUser: false,
            isInitial: true,
          },
        ]);
      }
    }
  }, [visible]);

  const handleSend = (queryToRun = null, displayLabel = null) => {
    const query = queryToRun || inputText.trim();
    if (!query) return;

    const displayText = displayLabel || query;
    if (!queryToRun) setInputText('');

    const userMsg = { text: displayText, isUser: true };
    const response = engine.predict(query);

    let aiMsg;
    if (response) {
      aiMsg = {
        text: `Emergency Guidance for: ${response.emergencyType}`,
        isUser: false,
        response,
      };
    } else {
      aiMsg = {
        text: 'I could not determine the exact emergency category. In any medical emergency, please stay calm and contact local emergency services (112 / 108 / 911) immediately.',
        isUser: false,
      };
    }

    setMessages((prev) => [...prev, userMsg, aiMsg]);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatText = (raw) => {
    if (!raw) return '';
    return raw
      .replace(/###\s*/g, '')
      .replace(/##\s*/g, '')
      .replace(/#\s*/g, '')
      .replace(/\*\*/g, '')
      .trim();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="hardware-chip-outline" size={24} color="#64FFDA" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Offline First Aid AI</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: engine.isLoaded ? '#69F0AE' : '#FFAB40' },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: engine.isLoaded ? '#69F0AE' : '#FFAB40' },
                  ]}
                >
                  {engine.isLoaded ? '100% Offline Model Active' : 'Loading Model...'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle-outline" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>

          {!engine.isLoaded && (
            <View style={styles.loadingBanner}>
              <ActivityIndicator size="small" color="#FFAB40" />
              <Text style={styles.loadingText}>
                Loading 100% Offline AI Engine... Please wait
              </Text>
            </View>
          )}

          {/* Quick Pill Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsScrollView}
            contentContainerStyle={styles.pillsContainer}
          >
            {QUICK_PILLS.map((pill, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.pill}
                onPress={() => handleSend(pill.query, pill.label)}
              >
                <Text style={styles.pillText}>{pill.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chat Messages List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScrollView}
            contentContainerStyle={styles.chatContent}
          >
            {messages.map((msg, idx) => {
              if (msg.isUser) {
                return (
                  <View key={idx} style={styles.userBubble}>
                    <Text style={styles.userText}>{msg.text}</Text>
                  </View>
                );
              }

              if (msg.isInitial) {
                return (
                  <View key={idx} style={styles.initialCard}>
                    <Text style={styles.aiText}>{msg.text}</Text>
                    <Text style={styles.selectTopicHeader}>
                      Select an emergency topic:
                    </Text>
                    {QUICK_PILLS.slice(0, 5).map((pill, pIdx) => (
                      <TouchableOpacity
                        key={pIdx}
                        style={styles.topicRow}
                        onPress={() => handleSend(pill.query, pill.label)}
                      >
                        <Text style={styles.topicLabel}>{pill.label}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#888" />
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              }

              const resp = msg.response;
              if (!resp) {
                return (
                  <View key={idx} style={styles.aiBubble}>
                    <Text style={styles.aiText}>{msg.text}</Text>
                  </View>
                );
              }

              const isCritical = resp.severityLevel
                .toLowerCase()
                .includes('critical');

              return (
                <View key={idx} style={styles.responseCard}>
                  {/* Category & Severity Header */}
                  <View style={styles.responseHeader}>
                    <Text style={styles.categoryTitle}>{resp.emergencyType}</Text>
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor: isCritical
                            ? 'rgba(255, 82, 82, 0.2)'
                            : 'rgba(255, 171, 64, 0.2)',
                          borderColor: isCritical ? '#FF5252' : '#FFAB40',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          { color: isCritical ? '#FF5252' : '#FFAB40' },
                        ]}
                      >
                        {resp.severityLevel.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Clinical QA Answer */}
                  {resp.qaAnswer && (
                    <View style={styles.qaBox}>
                      <Text style={styles.qaBoxTitle}>💬 CLINICAL QA ANSWER</Text>
                      <Text style={styles.qaBoxBody}>
                        {formatText(resp.qaAnswer)}
                      </Text>
                    </View>
                  )}

                  {/* Immediate Actions */}
                  {resp.immediateActions.length > 0 && (
                    <View style={[styles.sectionBox, styles.greenBox]}>
                      <Text style={styles.greenTitle}>
                        ⚡ IMMEDIATE ACTIONS TO PERFORM
                      </Text>
                      {resp.immediateActions.map((item, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <Text style={styles.greenBullet}>• </Text>
                          <Text style={styles.bulletText}>{formatText(item)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Actions to Avoid */}
                  {resp.actionsToAvoid.length > 0 && (
                    <View style={[styles.sectionBox, styles.redBox]}>
                      <Text style={styles.redTitle}>🚫 ACTIONS TO AVOID</Text>
                      {resp.actionsToAvoid.map((item, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <Text style={styles.redBullet}>• </Text>
                          <Text style={styles.bulletText}>{formatText(item)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Emergency Call Indicators */}
                  {resp.emergencyCallIndicators.length > 0 && (
                    <View style={[styles.sectionBox, styles.amberBox]}>
                      <Text style={styles.amberTitle}>
                        🚨 CALL 112 / 108 IMMEDIATELY IF
                      </Text>
                      {resp.emergencyCallIndicators.map((item, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <Text style={styles.amberBullet}>• </Text>
                          <Text style={styles.bulletText}>{formatText(item)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Monitoring Advice */}
                  {resp.monitoringAdvice.length > 0 && (
                    <View style={[styles.sectionBox, styles.blueBox]}>
                      <Text style={styles.blueTitle}>🩺 MONITORING ADVICE</Text>
                      {resp.monitoringAdvice.map((item, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <Text style={styles.blueBullet}>• </Text>
                          <Text style={styles.bulletText}>{formatText(item)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.disclaimerText}>{resp.disclaimer}</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Describe medical emergency..."
              placeholderTextColor="#777"
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => handleSend()}
            >
              <Ionicons name="send" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
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
    height: '88%',
    backgroundColor: '#1E1E2C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D44',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 171, 64, 0.2)',
    padding: 8,
    gap: 8,
  },
  loadingText: {
    color: '#FFAB40',
    fontSize: 12,
  },
  pillsScrollView: {
    maxHeight: 46,
    backgroundColor: '#1E1E2C',
  },
  pillsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  pill: {
    backgroundColor: '#3D3D5C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: {
    color: '#FFF',
    fontSize: 12,
  },
  chatScrollView: {
    flex: 1,
  },
  chatContent: {
    padding: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#00796B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 2,
    marginVertical: 4,
    maxWidth: '80%',
  },
  userText: {
    color: '#FFF',
    fontSize: 14,
  },
  initialCard: {
    backgroundColor: '#2D2D44',
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#00796B',
  },
  aiBubble: {
    backgroundColor: '#2D2D44',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  aiText: {
    color: '#DDD',
    fontSize: 13,
    lineHeight: 18,
  },
  selectTopicHeader: {
    color: '#64FFDA',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#383854',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  topicLabel: {
    color: '#FFF',
    fontSize: 13,
  },
  responseCard: {
    backgroundColor: '#2A2A3D',
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: '#00796B',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    color: '#64FFDA',
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  qaBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#42A5F5',
    marginBottom: 10,
  },
  qaBoxTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#80D8FF',
    marginBottom: 4,
  },
  qaBoxBody: {
    fontSize: 13,
    color: '#FFF',
    lineHeight: 18,
  },
  sectionBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  greenBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderColor: '#388E3C',
  },
  greenTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#69F0AE',
    marginBottom: 4,
  },
  greenBullet: {
    color: '#69F0AE',
    fontWeight: 'bold',
  },
  redBox: {
    backgroundColor: 'rgba(244, 67, 54, 0.12)',
    borderColor: '#D32F2F',
  },
  redTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF5252',
    marginBottom: 4,
  },
  redBullet: {
    color: '#FF5252',
    fontWeight: 'bold',
  },
  amberBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
    borderColor: '#FFA000',
  },
  amberTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFE082',
    marginBottom: 4,
  },
  amberBullet: {
    color: '#FFE082',
    fontWeight: 'bold',
  },
  blueBox: {
    backgroundColor: 'rgba(3, 169, 244, 0.12)',
    borderColor: '#0288D1',
  },
  blueTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#80D8FF',
    marginBottom: 4,
  },
  blueBullet: {
    color: '#80D8FF',
    fontWeight: 'bold',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bulletText: {
    color: '#DDD',
    fontSize: 12,
    flex: 1,
  },
  disclaimerText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#AAA',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#252538',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1E2C',
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    fontSize: 13,
  },
  sendButton: {
    backgroundColor: '#00796B',
    padding: 10,
    borderRadius: 20,
  },
});
