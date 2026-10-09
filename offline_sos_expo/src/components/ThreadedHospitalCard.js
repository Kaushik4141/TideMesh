import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  FlatList,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export function ThreadedHospitalCard({
  senderPhone,
  sessionId,
  packets = [],
  locationPacket,
  acceptPacket,
  hasAcceptance,
  isRescued,
  isSelfSent,
  distance = 0.0,
  estMins = 0,
  currentLat,
  currentLng,
  onAccept,
  onRescued,
  onOpenInAppMap,
  onOpenExternalMap,
  onSendMessage,
  onCaptureMedia,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [replyText, setReplyText] = useState('');

  const getBadgeTitle = () => {
    if (isRescued) return 'VICTIM RESCUED ✓';
    if (isSelfSent) {
      return hasAcceptance ? 'RESCUER DISPATCHED!' : 'SOS SENT • WAITING';
    }
    return hasAcceptance ? 'RESCUE DISPATCHED' : 'INCOMING EMERGENCY';
  };

  const getBadgeColor = () => {
    if (isRescued) return '#009688';
    return hasAcceptance ? '#4CAF50' : '#FF5252';
  };

  const handlePickMedia = async (useCamera = false, isVideo = false) => {
    try {
      let result;
      if (useCamera) {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: isVideo ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: isVideo ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onCaptureMedia(result.assets[0].uri, isVideo);
      }
    } catch (e) {
      console.warn('Media pick error:', e);
    }
  };

  const handleSendReply = () => {
    if (replyText.trim()) {
      onSendMessage(replyText.trim());
      setReplyText('');
    }
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isRescued
            ? 'rgba(0, 77, 64, 0.25)'
            : hasAcceptance
            ? 'rgba(27, 94, 32, 0.3)'
            : 'rgba(183, 28, 28, 0.2)',
        },
      ]}
    >
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
          <Text style={styles.badgeText}>{getBadgeTitle()}</Text>
        </View>
        <Text style={styles.contactText}>Contact: {senderPhone}</Text>
      </View>

      {/* Location Details */}
      {locationPacket && locationPacket.hasCoordinates && (
        <View style={styles.locationContainer}>
          <View style={styles.coordsHeaderRow}>
            <Ionicons name="location-sharp" size={16} color="#FFD54F" />
            <Text style={styles.coordsTitleText}>VICTIM LIVE LOCATION</Text>
          </View>
          <Text style={styles.coordsText}>
            Latitude: {locationPacket.lat}  |  Longitude: {locationPacket.long}
          </Text>
          <Text
            style={[
              styles.etaText,
              { color: isRescued ? '#64FFDA' : '#69F0AE' },
            ]}
          >
            {isRescued
              ? 'Status: Resolved & Archived'
              : `📍 Distance: ${distance.toFixed(2)} km  •  ⏱️ ETA: ${estMins} mins`}
          </Text>

          {/* Map Buttons */}
          <View style={styles.mapButtonsRow}>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() =>
                onOpenInAppMap(
                  sessionId,
                  senderPhone,
                  locationPacket.message || 'Emergency Location'
                )
              }
            >
              <Ionicons name="map" size={14} color="#FFF" />
              <Text style={styles.mapButtonText}>Live Offline Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={() =>
                onOpenExternalMap(locationPacket.lat, locationPacket.long)
              }
            >
              <Ionicons name="navigate" size={14} color="#FFF" />
              <Text style={styles.mapButtonText}>Navigate (Google Maps)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {!isSelfSent && !hasAcceptance && !isRescued && (
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>I'LL GO (ACCEPT MISSION)</Text>
        </TouchableOpacity>
      )}

      {!isSelfSent && hasAcceptance && !isRescued && (
        <TouchableOpacity style={styles.rescuedButton} onPress={onRescued}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>MARK AS RESCUED (COMPLETE)</Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider} />

      {/* Accordion Chat Header */}
      <TouchableOpacity
        style={styles.chatAccordionHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.chatTitleText}>
          Chat & Attachments ({packets.length})
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#FFAB40"
        />
      </TouchableOpacity>

      {/* Chat Messages */}
      {isExpanded && (
        <View style={styles.chatBodyContainer}>
          <View style={styles.messagesList}>
            {[...packets].reverse().map((msg, idx) => {
              const isMedia =
                msg.type === 'MEDIA' || msg.type === 'MEDIA_PENDING';
              return (
                <View
                  key={`${msg.sessionId || 'msg'}_${idx}`}
                  style={[
                    styles.messageBubble,
                    msg.isSentByMe
                      ? styles.myMessageBubble
                      : styles.theirMessageBubble,
                  ]}
                >
                  {isMedia ? (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons
                          name={
                            msg.type === 'MEDIA_PENDING'
                              ? 'cloud-upload-outline'
                              : 'image-outline'
                          }
                          size={14}
                          color={
                            msg.type === 'MEDIA_PENDING' ? '#FFAB40' : '#69F0AE'
                          }
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            marginLeft: 4,
                            color:
                              msg.type === 'MEDIA_PENDING'
                                ? '#FFAB40'
                                : '#69F0AE',
                          }}
                        >
                          {msg.type === 'MEDIA_PENDING'
                            ? 'Queued in WAL (Offline)'
                            : 'Media Attachment:'}
                        </Text>
                      </View>
                      {msg.localMediaPath ? (
                        <Image
                          source={{ uri: msg.localMediaPath }}
                          style={styles.mediaImage}
                        />
                      ) : (
                        <Image
                          source={{ uri: msg.message }}
                          style={styles.mediaImage}
                        />
                      )}
                      <Text style={styles.msgTimeText}>{msg.time}</Text>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.msgBodyText}>{msg.message}</Text>
                      <Text style={styles.msgTimeText}>{msg.time}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Reply Input Bar */}
          <View style={styles.replyInputRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handlePickMedia(true, false)}
            >
              <Ionicons name="camera-outline" size={20} color="#FFAB40" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handlePickMedia(false, false)}
            >
              <Ionicons name="images-outline" size={20} color="#FFAB40" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handlePickMedia(true, true)}
            >
              <Ionicons name="videocam-outline" size={20} color="#FFAB40" />
            </TouchableOpacity>

            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Send reply..."
              placeholderTextColor="#777"
            />

            <TouchableOpacity style={styles.sendBtn} onPress={handleSendReply}>
              <Ionicons name="send" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  contactText: {
    color: '#AAA',
    fontSize: 12,
  },
  locationContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.3)',
  },
  coordsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  coordsTitleText: {
    color: '#FFD54F',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  coordsText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  etaText: {
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 2,
  },
  mapButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mapButtonText: {
    color: '#FFF',
    fontSize: 11,
    marginLeft: 4,
  },
  acceptButton: {
    backgroundColor: '#388E3C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  rescuedButton: {
    backgroundColor: '#00796B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 10,
  },
  chatAccordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitleText: {
    color: '#FFAB40',
    fontWeight: 'bold',
    fontSize: 13,
  },
  chatBodyContainer: {
    marginTop: 8,
  },
  messagesList: {
    maxHeight: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  myMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#D84315',
  },
  theirMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#424242',
  },
  msgBodyText: {
    color: '#FFF',
    fontSize: 13,
  },
  msgTimeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 9,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  mediaImage: {
    width: 180,
    height: 120,
    borderRadius: 6,
    marginTop: 4,
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sendBtn: {
    backgroundColor: '#E64A19',
    padding: 8,
    borderRadius: 6,
  },
});
