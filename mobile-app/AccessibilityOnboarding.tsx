import React, { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Linking,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AccessibilityBridge = {
  isAccessibilityServiceEnabled?: () => Promise<boolean>;
  openAccessibilitySettings?: () => void;
};

type Props = {
  onEnabled: () => void;
};

const accessibilityModule = NativeModules.AccessibilityModule as AccessibilityBridge | undefined;

export default function AccessibilityOnboarding({ onEnabled }: Props) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!accessibilityModule?.isAccessibilityServiceEnabled) return;

    setChecking(true);
    try {
      const enabled = await accessibilityModule.isAccessibilityServiceEnabled();
      setIsEnabled(Boolean(enabled));
      if (enabled) onEnabled();
    } catch (error) {
      console.warn("Accessibility check failed:", error);
    } finally {
      setChecking(false);
    }
  }, [onEnabled]);

  useEffect(() => {
    void checkStatus();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void checkStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkStatus]);

  const openSettings = () => {
    if (accessibilityModule?.openAccessibilitySettings) {
      accessibilityModule.openAccessibilitySettings();
      return;
    }
    void Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>SOS</Text>
      <Text style={styles.title}>One-time SOS setup</Text>
      <Text style={styles.description}>
        ResQID needs the Android accessibility service turned on so it can send SOS from the
        Accessibility button or when you triple-press Volume Up, even if the phone is locked
        or the app is closed.
      </Text>

      <View style={styles.stepsContainer}>
        <Step number="1" text='Tap "Open Settings" below.' />
        <Step number="2" text='Open "ResQID Emergency SOS".' />
        <Step number="3" text="Turn the service on and confirm." />
        <Step number="4" text="Use the Accessibility button or press Volume Up 3 times for SOS." />
      </View>

      {isEnabled ? (
        <View style={styles.successBadge}>
          <Text style={styles.successText}>Accessibility service is active.</Text>
        </View>
      ) : (
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>Accessibility service is not enabled yet.</Text>
        </View>
      )}

      {!isEnabled && (
        <TouchableOpacity style={styles.button} onPress={openSettings}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.recheckButton} onPress={() => void checkStatus()} disabled={checking}>
        <Text style={styles.recheckText}>
          {checking ? "Checking..." : "I enabled it - check again"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Xiaomi path: Settings {"->"} Additional Settings {"->"} Accessibility {"->"} ResQID Emergency SOS
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
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  icon: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 4,
    color: "#ffffff",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: "#aaaaaa",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  stepsContainer: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e53e3e",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  stepText: {
    color: "#dddddd",
    fontSize: 14,
    flex: 1,
  },
  successBadge: {
    backgroundColor: "#1a3a1a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  successText: {
    color: "#4caf50",
    fontWeight: "600",
    fontSize: 14,
  },
  warningBadge: {
    backgroundColor: "#2a1a00",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  warningText: {
    color: "#ff9800",
    fontWeight: "600",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#e53e3e",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  recheckButton: {
    paddingVertical: 10,
    marginBottom: 16,
  },
  recheckText: {
    color: "#888888",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  hint: {
    color: "#555555",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
});
