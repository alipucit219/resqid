package com.resqid; // ← change to your actual package name

import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AccessibilityModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext mContext;

    public AccessibilityModule(ReactApplicationContext context) {
        super(context);
        mContext = context;
    }

    @Override
    public String getName() {
        return "AccessibilityModule";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Called from JS to check if SosAccessibilityService is currently enabled
    // ─────────────────────────────────────────────────────────────────────────
    @ReactMethod
    public void isAccessibilityServiceEnabled(Promise promise) {
        try {
            String expectedComponent = mContext.getPackageName()
                + "/" + SosAccessibilityService.class.getName();

            String enabledServices = Settings.Secure.getString(
                mContext.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );

            boolean enabled = enabledServices != null
                && enabledServices.contains(expectedComponent);

            promise.resolve(enabled);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deep-links directly to Accessibility settings — user lands right on the
    // correct page, just needs to find ResQID and toggle it on
    // ─────────────────────────────────────────────────────────────────────────
    @ReactMethod
    public void openAccessibilitySettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            mContext.startActivity(intent);
        } catch (Exception e) {
            // Fallback to general settings if deep link fails
            Intent fallback = new Intent(Settings.ACTION_SETTINGS);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            mContext.startActivity(fallback);
        }
    }
}
