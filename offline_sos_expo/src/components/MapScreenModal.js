import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Linking,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Svg, { Line } from 'react-native-svg';
import { LocalWalStore, isEmergencyProtocolMessage } from '../services/LocalWalStore';
import { ParsedPacket } from '../models/ParsedPacket';
import { SmsTransport } from '../services/SmsTransport';

let WebView = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (_) {}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(2)} km`;
}

function getOsmTileUrl(lat, lon, zoom = 15) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((lon + 180) / 360) * n);
  const ytile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${ytile}/${xtile}`;
}

function generateOsmHtml(vLat, vLng, rLat, rLng) {
  const victimLat = typeof vLat === 'number' && !isNaN(vLat) ? vLat : 12.9716;
  const victimLng = typeof vLng === 'number' && !isNaN(vLng) ? vLng : 77.5946;
  const rescuerLat = typeof rLat === 'number' && !isNaN(rLat) ? rLat : 12.9750;
  const rescuerLng = typeof rLng === 'number' && !isNaN(rLng) ? rLng : 77.5990;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      margin: 0; padding: 0; height: 100%; width: 100%; background: #121212;
    }
    .leaflet-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .victim-badge {
      background: #FF5252; color: #FFF; padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; border: 2px solid #FFF; text-align: center; white-space: nowrap; box-shadow: 0 4px 12px rgba(255,82,82,0.8);
    }
    .rescuer-badge {
      background: #00E676; color: #000; padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; border: 2px solid #FFF; text-align: center; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,230,118,0.8);
    }
    .leaflet-popup-content-wrapper {
      background: #1E1E2C; color: #FFF; border-radius: 8px; border: 1px solid #333; font-size: 12px;
    }
    .leaflet-popup-tip { background: #1E1E2C; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${victimLat}, ${victimLng}], 15);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '© Esri, OpenStreetMap'
    }).addTo(map);

    var victimIcon = L.divIcon({
      className: 'custom-icon',
      html: '<div class="victim-badge">🚨 VICTIM</div>',
      iconSize: [90, 32],
      iconAnchor: [45, 16]
    });

    var rescuerIcon = L.divIcon({
      className: 'custom-icon',
      html: '<div class="rescuer-badge">🚑 RESCUER</div>',
      iconSize: [90, 32],
      iconAnchor: [45, 16]
    });

    var victimMarker = L.marker([${victimLat}, ${victimLng}], { icon: victimIcon }).addTo(map)
      .bindPopup("<b>🚨 Victim Location</b><br/>Lat: ${victimLat.toFixed(6)}<br/>Lng: ${victimLng.toFixed(6)}");

    var rescuerMarker = L.marker([${rescuerLat}, ${rescuerLng}], { icon: rescuerIcon }).addTo(map)
      .bindPopup("<b>🚑 Rescuer Unit</b><br/>Lat: ${rescuerLat.toFixed(6)}<br/>Lng: ${rescuerLng.toFixed(6)}");

    var line = L.polyline([
      [${victimLat}, ${victimLng}],
      [${rescuerLat}, ${rescuerLng}]
    ], { color: '#FFAB40', weight: 4, dashArray: '8, 8' }).addTo(map);

    var group = new L.featureGroup([victimMarker, rescuerMarker]);
    map.fitBounds(group.getBounds().pad(0.3));
  </script>
</body>
</html>
  `;
}

export function MapScreenModal({ visible, onClose, sessionId, partnerPhone, label, isSelfSent }) {
  const [myLivePos, setMyLivePos] = useState(null);
  const [remoteVictimPos, setRemoteVictimPos] = useState(null);
  const [remoteRescuerPos, setRemoteRescuerPos] = useState(null);
  const [lastBroadcastPos, setLastBroadcastPos] = useState(null);
  const [mapMode, setMapMode] = useState('OSM'); // 'OSM' or 'RADAR'
  const webViewRef = useRef(null);

  useEffect(() => {
    let locationSub = null;
    let timer = null;

    if (visible) {
      loadLatestSessionLocations();

      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          locationSub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              distanceInterval: 10,
            },
            (pos) => {
              const coords = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              };
              setMyLivePos(coords);
              checkAndBroadcastMovement(pos.coords);
            }
          );
        }
      })();

      timer = setInterval(() => {
        loadLatestSessionLocations();
      }, 1000);
    }

    return () => {
      if (locationSub) locationSub.remove();
      if (timer) clearInterval(timer);
    };
  }, [visible, sessionId]);

  const loadLatestSessionLocations = async () => {
    const entries = await LocalWalStore.readAllRecords();
    const allPackets = [];

    for (const entry of entries) {
      const payload = entry.payload || '';
      const sender = entry.sender || '';
      const isMe = (entry.is_me || 0) === 1;

      if (isEmergencyProtocolMessage(payload)) {
        allPackets.push(
          ParsedPacket.fromString({ sender, rawBody: payload, isSentByMe: isMe })
        );
      }
    }

    let victimPkt = null;
    let rescuerPkt = null;

    if (isSelfSent) {
      rescuerPkt = allPackets.reverse().find(
        (p) =>
          (p.type === 'ACCEPT' || p.type === 'ALT' || p.type === 'SOS') &&
          p.hasCoordinates &&
          !p.isSentByMe
      );
    } else {
      victimPkt = allPackets.reverse().find(
        (p) =>
          (p.type === 'SOS' || p.type === 'ALT') &&
          p.hasCoordinates &&
          !p.isSentByMe
      );
    }

    if (victimPkt && victimPkt.hasCoordinates) {
      setRemoteVictimPos({
        latitude: victimPkt.parsedLat,
        longitude: victimPkt.parsedLng,
      });
    }

    if (rescuerPkt && rescuerPkt.hasCoordinates) {
      setRemoteRescuerPos({
        latitude: rescuerPkt.parsedLat,
        longitude: rescuerPkt.parsedLng,
      });
    }
  };

  const checkAndBroadcastMovement = (currentPos) => {
    if (!partnerPhone) return;

    if (lastBroadcastPos) {
      const R = 6371e3;
      const φ1 = (lastBroadcastPos.latitude * Math.PI) / 180;
      const φ2 = (currentPos.latitude * Math.PI) / 180;
      const Δφ = ((currentPos.latitude - lastBroadcastPos.latitude) * Math.PI) / 180;
      const Δλ = ((currentPos.longitude - lastBroadcastPos.longitude) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = R * c;

      if (distanceMeters >= 10.0) {
        setLastBroadcastPos(currentPos);
        const altPayload = `ALT|${sessionId}|${currentPos.latitude.toFixed(6)}|${currentPos.longitude.toFixed(6)}|Live Movement Update (10m+ moved)`;
        SmsTransport.sendSms(partnerPhone, altPayload);
        LocalWalStore.insertRecord({
          hlc: `${Date.now()}:0:MAP_NODE`,
          sender: partnerPhone,
          payload: altPayload,
          isMe: true,
        });
      }
    } else {
      setLastBroadcastPos(currentPos);
    }
  };

  const victimCoords = isSelfSent
    ? myLivePos || remoteVictimPos
    : remoteVictimPos;

  const rescuerCoords = !isSelfSent
    ? myLivePos || remoteRescuerPos
    : remoteRescuerPos;

  const vLat = victimCoords?.latitude || 12.9716;
  const vLng = victimCoords?.longitude || 77.5946;
  const rLat = rescuerCoords?.latitude || 12.9750;
  const rLng = rescuerCoords?.longitude || 77.5990;

  const distanceText = calculateDistanceKm(vLat, vLng, rLat, rLng);
  const osmHtml = generateOsmHtml(vLat, vLng, rLat, rLng);
  const victimOsmTile = getOsmTileUrl(vLat, vLng, 15);

  const openExternalOsmNav = () => {
    const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${rLat}%2C${rLng}%3B${vLat}%2C${vLng}`;
    Linking.openURL(url).catch(() => {});
  };

  const renderGridLines = () => {
    const step = 40;
    const lines = [];
    for (let x = 0; x < SCREEN_WIDTH; x += step) {
      lines.push(
        <Line
          key={`v_${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={SCREEN_HEIGHT}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      );
    }
    for (let y = 0; y < SCREEN_HEIGHT; y += step) {
      lines.push(
        <Line
          key={`h_${y}`}
          x1={0}
          y1={y}
          x2={SCREEN_WIDTH}
          y2={SCREEN_HEIGHT}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      );
    }
    return lines;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>OpenStreetMap Live Tracking</Text>
            <Text style={styles.headerSubtitle}>OSM Open-Source Map Active</Text>
          </View>

          {/* Mode Switcher */}
          <TouchableOpacity
            style={styles.modeToggleBtn}
            onPress={() => setMapMode(mapMode === 'OSM' ? 'RADAR' : 'OSM')}
          >
            <Ionicons
              name={mapMode === 'OSM' ? 'map' : 'radio'}
              size={18}
              color="#64FFDA"
            />
            <Text style={styles.modeToggleText}>
              {mapMode === 'OSM' ? 'OSM Map' : 'Radar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openExternalOsmNav} style={styles.navBtn}>
            <Ionicons name="navigate-circle" size={26} color="#69F0AE" />
          </TouchableOpacity>
        </View>

        {/* Telemetry Dashboard Banner */}
        <View style={styles.telemetryBanner}>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>🚨 VICTIM</Text>
            <Text style={styles.telemetryValue}>
              {vLat.toFixed(4)}, {vLng.toFixed(4)}
            </Text>
          </View>

          {distanceText && (
            <View style={styles.distanceBadge}>
              <Ionicons name="swap-horizontal" size={14} color="#FFAB40" />
              <Text style={styles.distanceText}>{distanceText}</Text>
            </View>
          )}

          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>🚑 RESCUER</Text>
            <Text style={styles.telemetryValue}>
              {rLat.toFixed(4)}, {rLng.toFixed(4)}
            </Text>
          </View>
        </View>

        {/* Main Display Area */}
        <View style={styles.mapContainer}>
          {mapMode === 'OSM' ? (
            Platform.OS === 'web' ? (
              <iframe
                srcDoc={osmHtml}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="OpenStreetMap Live Location"
              />
            ) : WebView ? (
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: osmHtml }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
              />
            ) : (
              /* Guaranteed OpenStreetMap Real Tile Image Renderer fallback */
              <View style={styles.tileMapWrapper}>
                <Image
                  source={{ uri: victimOsmTile }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
                <View style={styles.tileOverlay}>
                  {/* Victim Pin */}
                  <View style={[styles.markerWrapper, { top: '35%', left: '30%' }]}>
                    <View style={styles.victimLabel}>
                      <Text style={styles.labelText}>🚨 VICTIM</Text>
                    </View>
                    <Ionicons name="location" size={38} color="#FF5252" />
                    <Text style={styles.coordsSubtext}>
                      {vLat.toFixed(4)}, {vLng.toFixed(4)}
                    </Text>
                  </View>

                  {/* Rescuer Pin */}
                  <View style={[styles.markerWrapper, { top: '55%', left: '60%' }]}>
                    <View style={styles.rescuerLabel}>
                      <Text style={styles.labelText}>🚑 RESCUER</Text>
                    </View>
                    <Ionicons name="location" size={38} color="#69F0AE" />
                    <Text style={styles.coordsSubtext}>
                      {rLat.toFixed(4)}, {rLng.toFixed(4)}
                    </Text>
                  </View>
                </View>
              </View>
            )
          ) : (
            /* Tactical Radar View */
            <View style={styles.radarContainer}>
              <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH} style={StyleSheet.absoluteFill}>
                {renderGridLines()}
                <Line
                  x1={SCREEN_WIDTH / 2}
                  y1={0}
                  x2={SCREEN_WIDTH / 2}
                  y2={SCREEN_HEIGHT}
                  stroke="rgba(100, 255, 218, 0.2)"
                  strokeWidth="1.5"
                />
                <Line
                  x1={0}
                  y1={SCREEN_HEIGHT / 2}
                  x2={SCREEN_WIDTH}
                  y2={SCREEN_HEIGHT / 2}
                  stroke="rgba(100, 255, 218, 0.2)"
                  strokeWidth="1.5"
                />
              </Svg>

              <View style={[styles.markerWrapper, { top: SCREEN_HEIGHT / 2 - 60, left: SCREEN_WIDTH / 2 - 50 }]}>
                <View style={styles.victimLabel}>
                  <Text style={styles.labelText}>🚨 VICTIM</Text>
                </View>
                <Ionicons name="location" size={40} color="#FF5252" />
                <Text style={styles.coordsSubtext}>
                  {vLat.toFixed(4)}, {vLng.toFixed(4)}
                </Text>
              </View>

              <View style={[styles.markerWrapper, { top: SCREEN_HEIGHT / 2 + 40, left: SCREEN_WIDTH / 2 + 30 }]}>
                <View style={styles.rescuerLabel}>
                  <Text style={styles.labelText}>🚑 RESCUER</Text>
                </View>
                <Ionicons name="location" size={40} color="#69F0AE" />
                <Text style={styles.coordsSubtext}>
                  {rLat.toFixed(4)}, {rLng.toFixed(4)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer Quick Action Bar */}
        <View style={styles.footerBar}>
          <TouchableOpacity
            style={styles.openOsmNavBtn}
            onPress={openExternalOsmNav}
          >
            <Ionicons name="compass-outline" size={20} color="#000" />
            <Text style={styles.openOsmNavBtnText}>Open Turn-by-Turn Navigation</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2C',
    paddingTop: 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3F',
  },
  closeBtn: {
    paddingRight: 10,
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#64FFDA',
    fontSize: 11,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A3D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  modeToggleText: {
    color: '#64FFDA',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  navBtn: {
    paddingLeft: 4,
  },
  telemetryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A24',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#252538',
  },
  telemetryItem: {
    alignItems: 'flex-start',
  },
  telemetryLabel: {
    color: '#AAA',
    fontSize: 10,
    fontWeight: 'bold',
  },
  telemetryValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262335',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFAB40',
  },
  distanceText: {
    color: '#FFAB40',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  tileMapWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1B1B1B',
  },
  tileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  radarContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#12161F',
  },
  markerWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  victimLabel: {
    backgroundColor: '#B71C1C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  rescuerLabel: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  labelText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  coordsSubtext: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  footerBar: {
    backgroundColor: '#1E1E2C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#2D2D3F',
  },
  openOsmNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#69F0AE',
    paddingVertical: 12,
    borderRadius: 10,
  },
  openOsmNavBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
