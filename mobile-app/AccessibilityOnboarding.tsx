import React, { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Linking,
  NativeModules,
  Platform,
  ScrollView,
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

const accessibilityModule =
  Platform.OS === "android"
    ? (NativeModules.AccessibilityModule as AccessibilityBridge | undefined)
    : undefined;

export default function AccessibilityOnboarding({ onEnabled }: Props) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!accessibilityModule?.isAccessibilityServiceEnabled) {
      console.warn("[SOS Setup] AccessibilityModule not found, trying anyway...");
    }
    setChecking(true);
    try {
      if (accessibilityModule?.isAccessibilityServiceEnabled) {
        const enabled = await accessibilityModule.isAccessibilityServiceEnabled();
        setIsEnabled(Boolean(enabled));
        if (enabled) onEnabled();
      }
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
      try {
        accessibilityModule.openAccessibilitySettings();
        return;
      } catch (error) {
        console.warn("Native openAccessibilitySettings failed:", error);
      }
    }

    if (Platform.OS === "android") {
      Linking.sendIntent("android.settings.ACCESSIBILITY_SETTINGS").catch(() => {
        Linking.sendIntent("android.settings.SETTINGS").catch(() => {
          console.warn("Could not open any settings page");
        });
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>SOS</Text>
          </View>
          <Text style={styles.title}>One-time SOS Setup</Text>
          <Text style={styles.subtitle}>
            ResQID needs the Accessibility Service enabled so it can detect{"\n"}
            <Text style={styles.bold}>Volume Up x 3</Text> to send SOS{"\n"}
            while you are <Text style={styles.bold}>signed in and the phone is locked</Text>.
          </Text>
        </View>

        <View style={styles.card}>
          <Step number="1" text='Tap "Open Accessibility Settings" below.' />
          <Step number="2" text='Find "ResQID Emergency SOS" in the list.' />
          <Step number="3" text="Toggle it on and confirm the dialog." />
          <Step number="4" text="Come back here. Setup is done." />
        </View>

        {isEnabled ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Accessibility service is active.</Text>
          </View>
        ) : (
          <>
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>Accessibility service is not enabled yet.</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={openSettings}>
              <Text style={styles.buttonText}>Open Accessibility Settings</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.recheckButton}
          onPress={() => void checkStatus()}
          disabled={checking}
        >
          <Text style={styles.recheckText}>
            {checking ? "Checking..." : "I enabled it. Check again"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Xiaomi / MIUI: Settings, then Additional Settings, then Accessibility, then ResQID Emergency SOS
        </Text>
      </ScrollView>
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
  },
  scrollContent: {
    padding: 28,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e53e3e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconText: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: "#aaaaaa",
    textAlign: "center",
    lineHeight: 24,
  },
  bold: {
    color: "#ffffff",
    fontWeight: "600",
  },
  card: {
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
  successBanner: {
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
  warningBanner: {
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
