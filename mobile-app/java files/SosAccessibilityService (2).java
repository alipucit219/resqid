package com.resqid; // ← change to your actual package name

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
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

public class SosAccessibilityService extends AccessibilityService {

    private static final String TAG = "SosAccessibility";

    // ── Trigger config ────────────────────────────────────────────────────────
    private static final int    REQUIRED_PRESSES = 3;
    private static final long   WINDOW_MS        = 2000; // 2 second window
    private static final long   COOLDOWN_MS      = 5000; // prevent double-fire

    // ── API config ────────────────────────────────────────────────────────────
    // Update this to match your actual API base
    private static final String API_BASE    = "http://192.168.10.4:8000/v2";
    private static final int    TIMEOUT_MS  = 7000;

    // ── Notification channels ─────────────────────────────────────────────────
    private static final String CHANNEL_SOS      = "sos_channel_lock_v2";
    private static final String CHANNEL_STATUS   = "sos_status_channel";

    // ── State ─────────────────────────────────────────────────────────────────
    private int     mPressCount     = 0;
    private long    mLastSosTime    = 0;
    private boolean mSosInProgress  = false;

    private final Handler         mHandler       = new Handler(Looper.getMainLooper());
    private final Runnable        mResetRunnable = () -> mPressCount = 0;

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        // We only need key events — no need to observe UI events
        info.eventTypes    = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType  = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags         = AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS;
        setServiceInfo(info);

        createNotificationChannels();
        Log.d(TAG, "SosAccessibilityService connected");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Not used — we only care about key events
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "SosAccessibilityService interrupted");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Power button detection
    // Key events flow: each power button press fires KEYCODE_POWER on KEY_DOWN
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        if (event.getKeyCode() != KeyEvent.KEYCODE_POWER) {
            return false; // pass through all non-power key events
        }
        if (event.getAction() != KeyEvent.ACTION_DOWN) {
            return false; // only count presses, not releases
        }

        long now = System.currentTimeMillis();

        // Enforce cooldown to prevent accidental double-trigger
        if (now - mLastSosTime < COOLDOWN_MS) {
            return false;
        }

        mPressCount++;
        Log.d(TAG, "Power press count: " + mPressCount);

        // Reset counter after window expires
        mHandler.removeCallbacks(mResetRunnable);
        mHandler.postDelayed(mResetRunnable, WINDOW_MS);

        if (mPressCount >= REQUIRED_PRESSES) {
            mPressCount  = 0;
            mLastSosTime = now;
            mHandler.removeCallbacks(mResetRunnable);

            if (!mSosInProgress) {
                triggerSos();
            }
        }

        // Return false so power button still works normally (screen on/off)
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SOS trigger — runs on a background thread, no React context needed
    // ─────────────────────────────────────────────────────────────────────────

    private void triggerSos() {
        mSosInProgress = true;

        // Show immediate "sending" feedback on lockscreen
        showNotification(
            CHANNEL_SOS,
            9001,
            "🆘 SOS Triggered",
            "Sending emergency alert...",
            true
        );

        new Thread(() -> {
            try {
                String token = readTokenFromDb();

                JSONObject payload = new JSONObject();
                payload.put("latitude", 0);
                payload.put("longitude", 0);

                if (token != null) {
                    boolean sent = postSosAlert(token, payload.toString());
                    if (sent) {
                        showNotification(
                            CHANNEL_STATUS,
                            9002,
                            "🆘 ResQID Emergency Alert",
                            "Your emergency alert was sent successfully.",
                            true
                        );
                    } else {
                        queueOfflineAlert(payload.toString());
                        showNotification(
                            CHANNEL_STATUS,
                            9002,
                            "⚠️ ResQID Alert Queued",
                            "Server error — alert saved and will sync automatically.",
                            true
                        );
                    }
                } else {
                    queueOfflineAlert(payload.toString());
                    showNotification(
                        CHANNEL_STATUS,
                        9002,
                        "⚠️ ResQID Alert Queued",
                        "Not logged in — alert saved offline and will sync on login.",
                        true
                    );
                }
            } catch (Exception e) {
                Log.e(TAG, "SOS dispatch failed", e);
                showNotification(
                    CHANNEL_STATUS,
                    9002,
                    "⚠️ SOS Failed",
                    "Could not send alert. Please call emergency services.",
                    true
                );
            } finally {
                mSosInProgress = false;
            }
        }).start();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Network — POST /me/panic-alerts
    // ─────────────────────────────────────────────────────────────────────────

    private boolean postSosAlert(String token, String payloadJson) {
        try {
            URL url = new URL(API_BASE + "/me/panic-alerts");
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

    // ─────────────────────────────────────────────────────────────────────────
    // SQLite helpers — same DB as the JS (expo-sqlite) side
    // ─────────────────────────────────────────────────────────────────────────

    private String readTokenFromDb() {
        try {
            String dbPath = getDatabasePath("resqid.db").getAbsolutePath();
            SQLiteDatabase db = SQLiteDatabase.openDatabase(
                dbPath, null, SQLiteDatabase.OPEN_READONLY
            );
            Cursor cursor = db.rawQuery(
                "SELECT value FROM local_store WHERE key = ?",
                new String[]{"auth_token"}
            );
            if (cursor.moveToFirst()) {
                String raw = cursor.getString(0);
                cursor.close();
                db.close();
                // JS stores token as JSON.stringify(value) — strip surrounding quotes
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
            SQLiteDatabase db = SQLiteDatabase.openDatabase(
                dbPath, null, SQLiteDatabase.OPEN_READWRITE
            );
            db.execSQL(
                "INSERT INTO sync_queue (kind, payload, created_at) VALUES (?, ?, ?)",
                new Object[]{"panic_alert", payloadJson, System.currentTimeMillis()}
            );
            db.close();
        } catch (Exception e) {
            Log.e(TAG, "Failed to queue offline alert", e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Notification helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void createNotificationChannels() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;

        // SOS trigger channel — HIGH importance, wakes screen
        NotificationChannel sosCh = new NotificationChannel(
            CHANNEL_SOS, "SOS Emergency", NotificationManager.IMPORTANCE_HIGH
        );
        sosCh.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        sosCh.enableVibration(true);
        sosCh.enableLights(true);
        nm.createNotificationChannel(sosCh);

        // Status / result channel
        NotificationChannel statusCh = new NotificationChannel(
            CHANNEL_STATUS, "SOS Status", NotificationManager.IMPORTANCE_HIGH
        );
        statusCh.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(statusCh);
    }

    private void showNotification(String channelId, int id,
                                   String title, String body,
                                   boolean wakeScreen) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)  // ✅ visible on lockscreen
            .setAutoCancel(true);

        if (wakeScreen) {
            // ✅ Wakes the screen without opening the app — no PIN/biometric prompt
            builder.setFullScreenIntent(null, true);
        }

        nm.notify(id, builder.build());
    }
}
