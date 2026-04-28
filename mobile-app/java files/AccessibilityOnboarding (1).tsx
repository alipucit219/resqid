import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  Platform,
  Linking,
  NativeModules,
} from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Native module — add AccessibilityModule.java (see bottom of this file)
// It exposes two methods to JS:
//   isAccessibilityServiceEnabled() → Promise<boolean>
//   openAccessibilitySettings()     → void
// ─────────────────────────────────────────────────────────────────────────────
const { AccessibilityModule } = NativeModules;

interface Props {
  onEnabled: () => void; // called when service is confirmed enabled
}

export default function AccessibilityOnboarding({ onEnabled }: Props) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [checking, setChecking]   = useState(false);

  // Check status every time app comes to foreground
  // (user may have just come back from Settings)
  const checkStatus = useCallback(async () => {
    if (!AccessibilityModule) return;
    setChecking(true);
    try {
      const enabled: boolean = await AccessibilityModule.isAccessibilityServiceEnabled();
      setIsEnabled(enabled);
      if (enabled) onEnabled();
    } catch (e) {
      console.warn('Accessibility check failed:', e);
    } finally {
      setChecking(false);
    }
  }, [onEnabled]);

  useEffect(() => {
    checkStatus();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkStatus();
    });
    return () => sub.remove();
  }, [checkStatus]);

  const openSettings = () => {
    if (AccessibilityModule?.openAccessibilitySettings) {
      // Deep-links directly to Accessibility settings page
      AccessibilityModule.openAccessibilitySettings();
    } else {
      // Fallback for older Android versions
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      {/* Icon */}
      <Text style={styles.icon}>🆘</Text>

      {/* Title */}
      <Text style={styles.title}>One-time setup required</Text>

      {/* Description */}
      <Text style={styles.description}>
        ResQID needs Accessibility permission to detect{'\n'}
        <Text style={styles.bold}>triple power button press</Text> for emergency SOS.{'\n\n'}
        This works even when your phone is{'\n'}
        <Text style={styles.bold}>locked or the app is closed.</Text>
      </Text>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        <Step number="1" text='Tap "Open Settings" below' />
        <Step number="2" text='Find "ResQID Emergency SOS"' />
        <Step number="3" text="Toggle it ON and confirm" />
        <Step number="4" text="Come back — setup is done" />
      </View>

      {/* Status */}
      {isEnabled ? (
        <View style={styles.successBadge}>
          <Text style={styles.successText}>✅ Accessibility service is active</Text>
        </View>
      ) : (
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>⚠️ Not enabled yet</Text>
        </View>
      )}

      {/* CTA */}
      {!isEnabled && (
        <TouchableOpacity style={styles.button} onPress={openSettings}>
          <Text style={styles.buttonText}>Open Settings →</Text>
        </TouchableOpacity>
      )}

      {/* Manual re-check */}
      <TouchableOpacity
        style={styles.recheckButton}
        onPress={checkStatus}
        disabled={checking}>
        <Text style={styles.recheckText}>
          {checking ? 'Checking...' : 'I already enabled it — check again'}
        </Text>
      </TouchableOpacity>

      {/* Xiaomi-specific hint */}
      <Text style={styles.hint}>
        On Xiaomi: Settings → Additional Settings → Accessibility → ResQID Emergency SOS
      </Text>
    </View>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  bold: {
    color: '#ffffff',
    fontWeight: '600',
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e53e3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  stepText: {
    color: '#dddddd',
    fontSize: 14,
    flex: 1,
  },
  successBadge: {
    backgroundColor: '#1a3a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  successText: {
    color: '#4caf50',
    fontWeight: '600',
    fontSize: 14,
  },
  warningBadge: {
    backgroundColor: '#2a1a00',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  warningText: {
    color: '#ff9800',
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#e53e3e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  recheckButton: {
    paddingVertical: 10,
    marginBottom: 16,
  },
  recheckText: {
    color: '#888888',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  hint: {
    color: '#555555',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
});
