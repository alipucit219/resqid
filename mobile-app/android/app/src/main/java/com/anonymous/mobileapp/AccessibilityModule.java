package com.anonymous.mobileapp;

import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.text.TextUtils;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AccessibilityModule extends ReactContextBaseJavaModule {

    private static final String PREFS_NAME = "resqid_sos_config";
    private static final String KEY_API_BASE = "api_base";
    private static final String KEY_AUTH_TOKEN = "auth_token";

    private final ReactApplicationContext reactContext;

    public AccessibilityModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "AccessibilityModule";
    }

    @ReactMethod
    public void isAccessibilityServiceEnabled(Promise promise) {
        try {
            String expectedComponent = reactContext.getPackageName()
                + "/" + SosAccessibilityService.class.getName();
            String enabledServices = Settings.Secure.getString(
                reactContext.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );

            boolean enabled = false;
            if (!TextUtils.isEmpty(enabledServices)) {
                TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
                splitter.setString(enabledServices);
                while (splitter.hasNext()) {
                    if (expectedComponent.equalsIgnoreCase(splitter.next())) {
                        enabled = true;
                        break;
                    }
                }
            }

            promise.resolve(enabled);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void openAccessibilitySettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
        } catch (Exception e) {
            Intent fallback = new Intent(Settings.ACTION_SETTINGS);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(fallback);
        }
    }

    @ReactMethod
    public void syncSosConfig(String apiBase, String token) {
        SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, ReactApplicationContext.MODE_PRIVATE);
        prefs.edit()
            .putString(KEY_API_BASE, normalizeApiBase(apiBase))
            .putString(KEY_AUTH_TOKEN, safeTrim(token))
            .apply();
    }

    @ReactMethod
    public void clearSosConfig() {
        SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, ReactApplicationContext.MODE_PRIVATE);
        prefs.edit()
            .remove(KEY_API_BASE)
            .remove(KEY_AUTH_TOKEN)
            .apply();
    }

    @ReactMethod
    public void flushPendingSosQueue(Promise promise) {
        promise.resolve(0);
    }

    private String normalizeApiBase(String apiBase) {
        String safeValue = safeTrim(apiBase);
        if (safeValue.endsWith("/")) {
            return safeValue.substring(0, safeValue.length() - 1);
        }
        return safeValue;
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }
}
