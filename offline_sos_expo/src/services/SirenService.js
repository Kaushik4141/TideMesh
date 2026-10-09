import { Platform, Vibration, NativeModules } from 'react-native';

class SirenService {
  constructor() {
    this.soundObject = null;
    this.audioContext = null;
    this.oscillator = null;
    this.sirenInterval = null;
    this.isPlaying = false;
  }

  async startSiren() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // 1. Continuous Emergency Haptic Pattern
    try {
      Vibration.vibrate([500, 200, 500, 200], true);
    } catch (_) {}

    // 2. Safe Web Audio Synthesizer (Web Platform Only)
    if (Platform.OS === 'web') {
      try {
        const AudioContext =
          typeof window !== 'undefined'
            ? window.AudioContext || window.webkitAudioContext
            : null;

        if (AudioContext) {
          this.audioContext = new AudioContext();
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(800, this.audioContext.currentTime);

          let highFreq = true;
          this.sirenInterval = setInterval(() => {
            if (this.audioContext && osc) {
              const freq = highFreq ? 1200 : 700;
              osc.frequency.exponentialRampToValueAtTime(
                freq,
                this.audioContext.currentTime + 0.35
              );
              highFreq = !highFreq;
            }
          }, 400);

          gain.gain.setValueAtTime(1.0, this.audioContext.currentTime);
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.start();
          this.oscillator = osc;
        }
      } catch (e) {
        console.warn('Web Audio Siren notice:', e);
      }
    }

    // 3. Native Mobile Audio Siren (Safe fallback for Native clients)
    if (Platform.OS !== 'web') {
      try {
        const hasExponentAV = !!(
          NativeModules.ExponentAV ||
          NativeModules.ExpoAV ||
          (global.ExpoModules && (global.ExpoModules.ExponentAV || global.ExpoModules.ExpoAV))
        );

        if (hasExponentAV) {
          const { Audio } = require('expo-av');
          if (Audio) {
            await Audio.setAudioModeAsync({
              playsInSilentModeIOS: true,
              staysActiveInBackground: true,
              shouldDuckAndroid: false,
            });

            const { sound } = await Audio.Sound.createAsync(
              { uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
              { shouldPlay: true, isLooping: true, volume: 1.0 }
            );
            this.soundObject = sound;
          }
        }
      } catch (e) {
        console.warn('Native Audio Siren notice:', e);
      }
    }
  }

  async stopSiren() {
    this.isPlaying = false;

    try {
      Vibration.cancel();
    } catch (_) {}

    if (this.soundObject) {
      try {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
      } catch (_) {}
      this.soundObject = null;
    }

    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }

    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (_) {}
      this.oscillator = null;
    }

    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }
  }
}

export const sirenService = new SirenService();
