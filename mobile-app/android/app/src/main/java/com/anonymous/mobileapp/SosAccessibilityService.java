package com.anonymous.mobileapp;

import android.Manifest;
import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.PowerManager;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class SosAccessibilityService extends AccessibilityService {

    private static final String TAG = "SosAccessibility";
    private static final String PREFS_NAME = "resqid_sos_config";
    private static final String KEY_API_BASE = "api_base";
    private static final String KEY_AUTH_TOKEN = "auth_token";
    private static final int REQUIRED_PRESSES = 3;
    private static final long WINDOW_MS = 2000;
    private static final long COOLDOWN_MS = 5000;
    private static final String FALLBACK_API_BASE = "http://10.0.2.2:8000/v2";
    private static final int TIMEOUT_MS = 7000;
    private static final String CHANNEL_SOS = "sos_channel_lock_v2";
    private static final String CHANNEL_STATUS = "sos_status_channel";

    private int mPressCount = 0;
    private long mLastSosTime = 0;
    private boolean mSosInProgress = false;

    private final Handler mHandler = new Handler(Looper.getMainLooper());
    private final Runnable mResetRunnable = () -> mPressCount = 0;

    private static final class StoredLocation {
        final double latitude;
        final double longitude;

        StoredLocation(double latitude, double longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }
    }

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS;
        setServiceInfo(info);
        createNotificationChannels();
        Log.d(TAG, "SosAccessibilityService connected");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Not used. This service only cares about hardware key events.
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "SosAccessibilityService interrupted");
    }

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        if (event.getKeyCode() != KeyEvent.KEYCODE_VOLUME_UP) {
            return false;
        }
        if (event.getAction() != KeyEvent.ACTION_DOWN) {
            return false;
        }
        if (event.getRepeatCount() > 0) {
            return false;
        }
        boolean lockScreenActive = isLockScreenActive();
        boolean hasActiveSession = hasActiveSession();
        Log.d(
            TAG,
            "Volume up received. lockScreenActive=" + lockScreenActive
                + ", hasActiveSession=" + hasActiveSession
        );
        if (!lockScreenActive || !hasActiveSession) {
            resetPressTracking();
            return false;
        }

        long now = System.currentTimeMillis();
        if (now - mLastSosTime < COOLDOWN_MS) {
            return false;
        }

        mPressCount++;
        Log.d(TAG, "Volume up press count: " + mPressCount);

        mHandler.removeCallbacks(mResetRunnable);
        mHandler.postDelayed(mResetRunnable, WINDOW_MS);

        if (mPressCount >= REQUIRED_PRESSES) {
            mPressCount = 0;
            mLastSosTime = now;
            mHandler.removeCallbacks(mResetRunnable);

            if (!mSosInProgress) {
                triggerSos();
            }
        }

        return false;
    }

    private void triggerSos() {
        mSosInProgress = true;
        String token = readAuthToken();
        if (token == null || token.isEmpty()) {
            showNotification(
                CHANNEL_STATUS,
                9002,
                "ResQID SOS unavailable",
                "Sign in to ResQID to use lock-screen SOS.",
                true
            );
            mSosInProgress = false;
            return;
        }

        String bloodGroup = readMedicalData("bloodGroup");
        String allergies = readMedicalData("allergies");
        String address = readMedicalData("address");
        String lockScreenBody = buildLockScreenMessage(bloodGroup, allergies, address);

        showNotification(
            CHANNEL_SOS,
            9001,
            "ResQID emergency alert",
            lockScreenBody,
            true
        );

        new Thread(() -> {
            try {
                JSONObject payload = new JSONObject();
                StoredLocation location = readBestKnownLocation();
                payload.put("latitude", location != null ? location.latitude : 0);
                payload.put("longitude", location != null ? location.longitude : 0);

                boolean sent = postSosAlert(token, payload.toString());
                if (sent) {
                    showNotification(
                        CHANNEL_STATUS,
                        9002,
                        "ResQID emergency alert sent",
                        "Your emergency alert was sent successfully.",
                        true
                    );
                } else {
                    queueOfflineAlert(payload.toString());
                    showNotification(
                        CHANNEL_STATUS,
                        9002,
                        "ResQID alert queued",
                        "Server error. Alert saved and will sync automatically.",
                        true
                    );
                }
            } catch (Exception e) {
                Log.e(TAG, "SOS dispatch failed", e);
                showNotification(
                    CHANNEL_STATUS,
                    9002,
                    "SOS failed",
                    "Could not send alert. Please call emergency services.",
                    true
                );
            } finally {
                mSosInProgress = false;
            }
        }).start();
    }

    private String readMedicalData(String key) {
        try {
            String dbPath = getDatabasePath("resqid.db").getAbsolutePath();
            SQLiteDatabase db = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READONLY);
            Cursor cursor = db.rawQuery(
                "SELECT value FROM local_store WHERE key = ?",
                new String[]{"profile_" + key}
            );
            if (cursor.moveToFirst()) {
                String value = cursor.getString(0);
                cursor.close();
                db.close();
                if (value != null && value.startsWith("\"") && value.endsWith("\"")) {
                    return value.substring(1, value.length() - 1);
                }
                return value;
            }
            cursor.close();
            db.close();
        } catch (Exception e) {
            Log.e(TAG, "Failed to read medical data: " + key, e);
        }
        return "";
    }

    private String buildLockScreenMessage(String bloodGroup, String allergies, String address) {
        StringBuilder msg = new StringBuilder();
        if (bloodGroup != null && !bloodGroup.isEmpty()) {
            msg.append("Blood Group: ").append(bloodGroup);
        }
        if (allergies != null && !allergies.isEmpty()) {
            if (msg.length() > 0) {
                msg.append(" | ");
            }
            msg.append("Allergies: ").append(allergies);
        }
        if (address != null && !address.isEmpty()) {
            if (msg.length() > 0) {
                msg.append(" | ");
            }
            msg.append("Address: ").append(address);
        }
        return msg.length() > 0 ? msg.toString() : "Emergency alert sent";
    }

    private StoredLocation readBestKnownLocation() {
        StoredLocation deviceLocation = readDeviceLastKnownLocation();
        if (deviceLocation != null) {
            return deviceLocation;
        }
        return readStoredLocationFromDb();
    }

    private StoredLocation readDeviceLastKnownLocation() {
        try {
            boolean hasFine = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            boolean hasCoarse = checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            if (!hasFine && !hasCoarse) {
                return null;
            }

            LocationManager locationManager = getSystemService(LocationManager.class);
            if (locationManager == null) {
                return null;
            }

            List<String> providers = locationManager.getProviders(true);
            Location best = null;
            for (String provider : providers) {
                Location candidate = locationManager.getLastKnownLocation(provider);
                if (candidate == null) {
                    continue;
                }
                if (best == null || candidate.getTime() > best.getTime()) {
                    best = candidate;
                }
            }

            if (best == null) {
                return null;
            }
            return new StoredLocation(best.getLatitude(), best.getLongitude());
        } catch (Exception e) {
            Log.e(TAG, "Failed to read device last known location", e);
            return null;
        }
    }

    private StoredLocation readStoredLocationFromDb() {
        try {
            String dbPath = getDatabasePath("resqid.db").getAbsolutePath();
            SQLiteDatabase db = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READONLY);
            Cursor cursor = db.rawQuery(
                "SELECT value FROM local_store WHERE key = ?",
                new String[]{"last_location"}
            );
            if (cursor.moveToFirst()) {
                String raw = cursor.getString(0);
                cursor.close();
                db.close();

                if (raw == null || raw.trim().isEmpty()) {
                    return null;
                }

                JSONObject payload = new JSONObject(raw);
                double latitude = payload.optDouble("latitude", Double.NaN);
                double longitude = payload.optDouble("longitude", Double.NaN);
                if (Double.isNaN(latitude) || Double.isNaN(longitude)) {
                    return null;
                }
                return new StoredLocation(latitude, longitude);
            }
            cursor.close();
            db.close();
        } catch (Exception e) {
            Log.e(TAG, "Failed to read cached SOS location", e);
        }
        return null;
    }

    private boolean postSosAlert(String token, String payloadJson) {
        try {
            URL url = new URL(readApiBase() + "/me/panic-alerts");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setConnectTimeout(TIMEOUT_MS);
            conn.setReadTimeout(TIMEOUT_MS);
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(payloadJson.getBytes(StandardCharsets.UTF_8));
            }

            int code = conn.getResponseCode();
            return code >= 200 && code < 300;
        } catch (Exception e) {
            Log.e(TAG, "POST failed", e);
            return false;
        }
    }

    private String readAuthToken() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String token = safeTrim(prefs.getString(KEY_AUTH_TOKEN, ""));
        if (!token.isEmpty()) {
            return token;
        }
        return readTokenFromDb();
    }

    private String readApiBase() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String apiBase = safeTrim(prefs.getString(KEY_API_BASE, ""));
        if (!apiBase.isEmpty()) {
            return apiBase.replaceAll("/+$", "");
        }
        return FALLBACK_API_BASE;
    }

    private String readTokenFromDb() {
        try {
            String dbPath = getDatabasePath("resqid.db").getAbsolutePath();
            SQLiteDatabase db = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READONLY);
            Cursor cursor = db.rawQuery(
                "SELECT value FROM local_store WHERE key = ?",
                new String[]{"auth_token"}
            );
            if (cursor.moveToFirst()) {
                String raw = cursor.getString(0);
                cursor.close();
                db.close();
                if (raw != null && raw.startsWith("\"") && raw.endsWith("\"")) {
                    return raw.substring(1, raw.length() - 1);
                }
                return raw;
            }
            cursor.close();
            db.close();
        } catch (Exception e) {
            Log.e(TAG, "Failed to read token", e);
        }
        return null;
    }

    private void queueOfflineAlert(String payloadJson) {
        try {
            String dbPath = getDatabasePath("resqid.db").getAbsolutePath();
            SQLiteDatabase db = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READWRITE);
            db.execSQL(
                "INSERT INTO sync_queue (kind, payload, created_at) VALUES (?, ?, ?)",
                new Object[]{"panic_alert", payloadJson, System.currentTimeMillis()}
            );
            db.close();
        } catch (Exception e) {
            Log.e(TAG, "Failed to queue offline alert", e);
        }
    }

    private void createNotificationChannels() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) {
            return;
        }

        NotificationChannel sosChannel = new NotificationChannel(
            CHANNEL_SOS, "SOS Emergency", NotificationManager.IMPORTANCE_HIGH
        );
        sosChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        sosChannel.enableVibration(true);
        sosChannel.enableLights(true);
        nm.createNotificationChannel(sosChannel);

        NotificationChannel statusChannel = new NotificationChannel(
            CHANNEL_STATUS, "SOS Status", NotificationManager.IMPORTANCE_HIGH
        );
        statusChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(statusChannel);
    }

    private void showNotification(String channelId, int id, String title, String body, boolean wakeScreen) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) {
            return;
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true);

        if (wakeScreen) {
            builder.setFullScreenIntent(null, true);
        }

        nm.notify(id, builder.build());
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private void resetPressTracking() {
        mPressCount = 0;
        mHandler.removeCallbacks(mResetRunnable);
    }

    private boolean hasActiveSession() {
        String token = readAuthToken();
        return token != null && !token.isEmpty();
    }

    private boolean isLockScreenActive() {
        KeyguardManager keyguardManager = getSystemService(KeyguardManager.class);
        PowerManager powerManager = getSystemService(PowerManager.class);
        boolean screenOff = powerManager != null && !powerManager.isInteractive();
        boolean keyguardLocked = keyguardManager != null && keyguardManager.isKeyguardLocked();
        return screenOff || keyguardLocked;
    }
}
