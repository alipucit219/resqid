import { StatusBar } from "expo-status-bar";
import { type ComponentProps, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import {
  AppState,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  NativeModules,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import * as SQLite from "expo-sqlite";
import * as Clipboard from "expo-clipboard";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type AuthScreen = "login" | "register" | "forgot" | "verifyReset" | "reset" | "public";
type Tab = "home" | "profile" | "summary" | "contacts";
type Method = "GET" | "POST" | "PUT" | "DELETE";
type QueueKind = "profile_upsert" | "summary_upsert" | "contact_upsert" | "contact_delete" | "panic_alert";
type Gender = "male" | "female" | "other";
type StatusTone = "success" | "error" | "info";
type IconName = ComponentProps<typeof Ionicons>["name"];
type ToastItem = { id: number; message: string; tone: StatusTone };
type AuthFieldErrors = Partial<
  Record<
    "fullName" | "email" | "phoneNumber" | "cnic" | "address" | "dateOfBirth" | "gender" | "password" | "confirmPassword",
    string
  >
>;

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  phoneNumber?: string | null;
  cnic?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
};
type Contact = { id: string; name: string; phoneNumber: string; email?: string | null; relationship?: string | null; isPrimary?: boolean };
type Profile = {
  bloodGroup: string;
  cnic: string;
  age: string;
  address: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  emergencyNotes: string;
  dateOfBirth: string;
  gender: string;
};
type SummaryEntry = {
  id: string;
  hospitalName: string;
  doctorName: string;
  diseaseStartingYear: string;
  treatmentDuration: string;
  treatmentStatus: string;
  checkupFiles: string[];
  currentMedications: string[];
  notes: string;
};
type Summary = SummaryEntry;
type QrData = { qrCodeDataUrl?: string | null; emergencyUrl?: string | null };
type Snapshot = { user: User; profile: Profile; summary: Summary; summaries: Summary[]; contacts: Contact[]; qr: QrData | null; savedAt: string };
type PublicData = { user: { fullName: string }; medicalProfile: any; medicalSummary?: any; emergencyContacts: any[] };
type QueueRow = { id: number; kind: QueueKind; payload: string };

const normalizeApiBase = (value: string) => {
  const candidate = value.replace(/\/$/, "");
  return /\/v\d+$/i.test(candidate) ? candidate : `${candidate}/v2`;
};
const currentApiOrigin = () => ACTIVE_API.replace(/\/v\d+$/i, "");
const inferDevApiBase = () => {
  if (Platform.OS === "web") return "http://localhost:8000";

  const scriptUrl = String(NativeModules?.SourceCode?.scriptURL || "").trim();
  if (!scriptUrl) return "";

  try {
    const parsed = new URL(scriptUrl);
    const host = parsed.hostname.toLowerCase();
    if (!host || host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
      return "http://localhost:8000";
    }
    return `${parsed.protocol}//${parsed.hostname}:8000`;
  } catch {
    return "";
  }
};
const resolveApiBases = () => {
  const webBase = process.env.EXPO_PUBLIC_WEB_API_BASE_URL;
  const iosBase = process.env.EXPO_PUBLIC_IOS_API_BASE_URL;
  const androidBase = process.env.EXPO_PUBLIC_ANDROID_API_BASE_URL;
  const nativeBase = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;
  const inferredBase = inferDevApiBase();
  const fallbackBase =
    Platform.OS === "web"
      ? "http://localhost:8000"
      : Platform.OS === "android"
        ? inferredBase || "http://192.168.10.4:8000"
        : inferredBase || "http://localhost:8000";
  const priority =
    Platform.OS === "web"
      ? [webBase, nativeBase, fallbackBase]
      : Platform.OS === "ios"
        ? [inferredBase, iosBase, nativeBase, fallbackBase]
        : [inferredBase, androidBase, nativeBase, "http://192.168.10.4:8000", fallbackBase];

  const withAlternates = [...priority, webBase, iosBase, androidBase, nativeBase, inferredBase, fallbackBase]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => normalizeApiBase(item));

  return [...new Set(withAlternates)];
};
const API_BASES = resolveApiBases();
let ACTIVE_API = API_BASES[0];
const API = ACTIVE_API;
const normalizeEmergencyUrl = (value?: string | null) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (["127.0.0.1", "localhost", "0.0.0.0"].includes(parsed.hostname.toLowerCase())) {
      const origin = new URL(currentApiOrigin());
      parsed.protocol = origin.protocol;
      parsed.hostname = origin.hostname;
      parsed.port = origin.port;
      return parsed.toString().replace(/\/$/, "");
    }
    return raw;
  } catch {
    return raw;
  }
};
const resolveAssetUrl = (value?: string | null) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const apiOrigin = currentApiOrigin();
  if (raw.startsWith("/")) return `${apiOrigin}${raw}`;
  return `${apiOrigin}/${raw.replace(/^\/+/, "")}`;
};
const fileNameFromPath = (value?: string | null) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const cleaned = raw.split("?")[0].split("#")[0];
  return cleaned.split("/").filter(Boolean).pop() || "";
};
const displayCheckupFileLabel = (value?: string | null) => {
  const raw = String(value || "").trim();
  if (!raw) return "Uploaded PDF";
  const fileName = fileNameFromPath(raw);
  return fileName || raw;
};
const resolveCheckupDownloadUrl = (value?: string | null) => {
  const fileName = fileNameFromPath(value);
  if (!fileName) return "";
  return `${ACTIVE_API}/me/medical-summary/checkup-files/${encodeURIComponent(fileName)}/download`;
};

const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS: Gender[] = ["male", "female", "other"];
const STATUS_AUTO_HIDE_MS = 3500;
const REQUEST_TIMEOUT_MS = 7000;
const LOCK_CHANNEL_ID = "lockscreen-alert";
const EMPTY_REGISTER = {
  fullName: "",
  email: "",
  phoneNumber: "",
  cnic: "",
  address: "",
  dateOfBirth: "",
  gender: "",
  password: "",
  confirmPassword: "",
};
const EMPTY_PROFILE: Profile = {
  bloodGroup: "",
  cnic: "",
  age: "",
  address: "",
  allergies: [],
  chronicConditions: [],
  medications: [],
  emergencyNotes: "",
  dateOfBirth: "",
  gender: "",
};
const EMPTY_SUMMARY: Summary = {
  id: "",
  hospitalName: "",
  doctorName: "",
  diseaseStartingYear: "",
  treatmentDuration: "",
  treatmentStatus: "",
  checkupFiles: [],
  currentMedications: [],
  notes: "",
};

const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/;
const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;
const PDF_FILE_REGEX = /\.pdf([?#].*)?$/i;

const arr = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x || "").trim()).filter(Boolean) : []);
const asDate = (v: unknown) => {
  const d = new Date(String(v || ""));
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};
const toYmd = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const ymdToDate = (value: string) => {
  const parsed = new Date(`${value || ""}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};
const tokenFrom = (v: string) =>
  v.includes("/emergency-access/")
    ? v.split("/emergency-access/")[1].split("?")[0].split("#")[0].trim()
    : v.trim();
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Unexpected error");
const netErr = (e: unknown) =>
  /network request failed|fetch failed|failed to fetch|abort|timeout|timed out/i.test(errMsg(e));
const labelCount = (count: number, singular: string, plural?: string) =>
  `${count} ${count === 1 ? singular : plural || `${singular}s`}`;
const isValidPhoneNumber = (value: string) => PHONE_REGEX.test(String(value || "").trim());
const isValidCnic = (value: string) => CNIC_REGEX.test(String(value || "").trim());
const isPdfReference = (value: string) => PDF_FILE_REGEX.test(String(value || "").trim());
const safeId = () => `summary-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const normalizeSummaryEntry = (value: any, fallbackId?: string): Summary => ({
  id: String(value?.id || fallbackId || safeId()),
  hospitalName: String(value?.hospitalName || ""),
  doctorName: String(value?.doctorName || ""),
  diseaseStartingYear:
    value?.diseaseStartingYear !== undefined && value?.diseaseStartingYear !== null
      ? String(value.diseaseStartingYear)
      : "",
  treatmentDuration: String(value?.treatmentDuration || ""),
  treatmentStatus: String(value?.treatmentStatus || ""),
  checkupFiles: arr(value?.checkupFiles),
  currentMedications: arr(value?.currentMedications),
  notes: String(value?.notes || ""),
});
const hasSummaryContent = (value: Summary) =>
  Boolean(
    value.hospitalName.trim() ||
      value.doctorName.trim() ||
      value.diseaseStartingYear.trim() ||
      value.treatmentDuration.trim() ||
      value.treatmentStatus.trim() ||
      value.notes.trim() ||
      value.checkupFiles.length ||
      value.currentMedications.length,
  );
const sortSummaryEntries = (items: Summary[]) =>
  [...items].sort((a, b) => String(b.id).localeCompare(String(a.id)));
const mergeSummaryDraft = (items: Summary[], draft: Summary) => {
  const cleanItems = items.filter((item) => item.id !== draft.id);
  if (!hasSummaryContent(draft)) return sortSummaryEntries(cleanItems);
  return sortSummaryEntries([{ ...draft, id: draft.id || safeId() }, ...cleanItems]);
};
const joinOrFallback = (items: string[], fallback = "None") => {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  return clean.length ? clean.join(", ") : fallback;
};
const toNumericYear = (value: string) => {
  const year = Number(value);
  if (!Number.isInteger(year)) return null;
  if (year < 1900 || year > new Date().getFullYear()) return null;
  return year;
};
const toNumericAge = (value: string) => {
  const age = Number(value);
  if (!Number.isInteger(age)) return null;
  if (age < 1 || age > 120) return null;
  return age;
};
const toContactBody = (payload: any) => ({
  name: String(payload?.name || "").trim(),
  phoneNumber: String(payload?.phoneNumber || "").trim(),
  email: String(payload?.email || "").trim().toLowerCase() || undefined,
  relationship: payload?.relationship ? String(payload.relationship).trim() : undefined,
  isPrimary: Boolean(payload?.isPrimary),
});

async function api<T>(path: string, method: Method = "GET", token?: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const order = [ACTIVE_API, ...API_BASES.filter((base) => base !== ACTIVE_API)];
  let lastNetworkError: unknown = null;

  for (const base of order) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const res = await fetch(`${base}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || `${method} ${path} failed (${res.status})`,
        );
      }

      ACTIVE_API = base;
      return data as T;
    } catch (error) {
      if (!netErr(error)) throw error;
      lastNetworkError = error;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  throw new Error(
    `Network request failed. Tried: ${order.join(", ")}. ${errMsg(lastNetworkError)}`,
  );
}

async function initDb(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS local_store (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}
async function setKV(db: SQLite.SQLiteDatabase, key: string, value: unknown) {
  await db.runAsync(
    `INSERT INTO local_store (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    JSON.stringify(value),
    Date.now(),
  );
}
async function getKV<T>(db: SQLite.SQLiteDatabase, key: string): Promise<T | null> {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM local_store WHERE key = ?", key);
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}
async function delKV(db: SQLite.SQLiteDatabase, key: string) {
  await db.runAsync("DELETE FROM local_store WHERE key = ?", key);
}
async function addQ(db: SQLite.SQLiteDatabase, kind: QueueKind, payload: unknown) {
  await db.runAsync("INSERT INTO sync_queue (kind, payload, created_at) VALUES (?, ?, ?)", kind, JSON.stringify(payload), Date.now());
}
async function listQ(db: SQLite.SQLiteDatabase): Promise<QueueRow[]> {
  return await db.getAllAsync<QueueRow>("SELECT id, kind, payload FROM sync_queue ORDER BY id ASC");
}
async function delQ(db: SQLite.SQLiteDatabase, id: number) {
  await db.runAsync("DELETE FROM sync_queue WHERE id = ?", id);
}

type FieldProps = {
  icon: IconName;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: ComponentProps<typeof TextInput>["autoCapitalize"];
  right?: ReactNode;
  multiline?: boolean;
};

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "none",
  right,
  multiline = false,
}: FieldProps) {
  return (
    <View style={[s.fieldWrap, multiline && s.fieldWrapMulti]}>
      <Ionicons name={icon} size={20} color="#6b7280" />
      <TextInput
        style={[s.fieldInput, multiline && s.fieldInputMulti]}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
      />
      {right}
    </View>
  );
}

export default function App() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [ready, setReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [qCount, setQCount] = useState(0);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [tab, setTab] = useState<Tab>("home");
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");
  const [resetCodeInput, setResetCodeInput] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [register, setRegister] = useState({ ...EMPTY_REGISTER });
  const [registerErrors, setRegisterErrors] = useState<AuthFieldErrors>({});
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showRegisterDobPicker, setShowRegisterDobPicker] = useState(false);
  const [showProfileDobPicker, setShowProfileDobPicker] = useState(false);

  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [summary, setSummary] = useState<Summary>({ ...EMPTY_SUMMARY, id: safeId() });
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [qr, setQr] = useState<QrData | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const [aDraft, setADraft] = useState("");
  const [cDraft, setCDraft] = useState("");
  const [mDraft, setMDraft] = useState("");
  const [checkupFileDraft, setCheckupFileDraft] = useState("");
  const [smDraft, setSmDraft] = useState("");

  const [contactForm, setContactForm] = useState({
    id: "",
    name: "",
    phoneNumber: "",
    email: "",
    relationship: "",
    isPrimary: false,
  });
  const [showContactForm, setShowContactForm] = useState(false);

  const [showSos, setShowSos] = useState(false);
  const [showQrSheet, setShowQrSheet] = useState(false);
  const [showIdentitySheet, setShowIdentitySheet] = useState(false);
  const [panicMsg, setPanicMsg] = useState("");
  const [lastLoc, setLastLoc] = useState<{ latitude: number; longitude: number } | null>(null);

  const [publicInput, setPublicInput] = useState("");
  const [publicData, setPublicData] = useState<PublicData | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerLocked, setScannerLocked] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [lockPin, setLockPin] = useState("");
  const [lockPinDraft, setLockPinDraft] = useState("");
  const [lockPinConfirm, setLockPinConfirm] = useState("");
  const [unlockPin, setUnlockPin] = useState("");
  const [lockHint, setLockHint] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  const syncing = useRef(false);
  const toastTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const mainScrollRef = useRef<ScrollView>(null);
  const firstName = useMemo(() => user?.fullName?.split(" ")[0] || "Demo", [user?.fullName]);

  const dismissToast = (id: number) => {
    const timer = toastTimers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete toastTimers.current[id];
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };
  const pushToast = (message: string, tone: StatusTone = "info") => {
    const finalMessage = String(message || "").trim();
    if (!finalMessage) return;
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message: finalMessage, tone }]);
    toastTimers.current[id] = setTimeout(() => {
      dismissToast(id);
    }, STATUS_AUTO_HIDE_MS);
  };
  const setInfo = (msg: string) => {
    pushToast(msg, "info");
  };
  const setOk = (msg: string) => {
    pushToast(msg, "success");
  };
  const setQrSafe = (value: QrData | null) => {
    if (!value) {
      setQr(null);
      return;
    }
    setQr({
      ...value,
      emergencyUrl: normalizeEmergencyUrl(value.emergencyUrl),
    });
  };
  const scheduleAlertNotification = async (title: string, body: string) => {
    const settings = await Notifications.getPermissionsAsync();
    let finalStatus = settings.status;
    if (finalStatus !== "granted") {
      finalStatus = (await Notifications.requestPermissionsAsync()).status;
    }
    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(LOCK_CHANNEL_ID, {
        name: "Lock screen alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        ...(Platform.OS === "android" ? { channelId: LOCK_CHANNEL_ID } : {}),
      },
      trigger: null,
    });
  };
  const getActiveSummaries = () => mergeSummaryDraft(summaries, summary);
  const clearSummaryDraft = () => {
    setSummary({ ...EMPTY_SUMMARY, id: safeId() });
    setCheckupFileDraft("");
    setSmDraft("");
  };
  const resetRegisterForm = () => {
    setRegister({ ...EMPTY_REGISTER });
    setRegisterErrors({});
    setShowRegPassword(false);
    setShowRegConfirm(false);
    setShowRegisterDobPicker(false);
  };
  const resetResetPasswordForm = () => {
    setResetCodeInput("");
    setResetPassword("");
    setResetConfirmPassword("");
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
  };
  const onRegisterDobChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowRegisterDobPicker(false);
    if (selected) {
      setRegister((prev) => ({ ...prev, dateOfBirth: toYmd(selected) }));
    }
  };
  const onProfileDobChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowProfileDobPicker(false);
    if (selected) {
      setProfile((prev) => ({ ...prev, dateOfBirth: toYmd(selected) }));
    }
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      pushToast(errMsg(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const updateQCount = async () => {
    if (!db) return;
    setQCount((await listQ(db)).length);
  };

  const queue = async (kind: QueueKind, payload: unknown) => {
    if (!db) throw new Error("Local DB is not ready.");
    await addQ(db, kind, payload);
    await updateQCount();
  };

  const toPublic = (snap: Snapshot): PublicData => {
    const visibleSummaries = snap.summaries?.length ? snap.summaries : hasSummaryContent(snap.summary) ? [snap.summary] : [];
    const primarySummary = visibleSummaries[0] || snap.summary;
    return {
    user: { fullName: snap.user.fullName },
    medicalProfile: {
      bloodGroup: snap.profile.bloodGroup || null,
      cnic: snap.profile.cnic || null,
      age: snap.profile.age ? Number(snap.profile.age) : null,
      address: snap.profile.address || null,
      allergies: snap.profile.allergies,
      chronicConditions: snap.profile.chronicConditions,
      medications: snap.profile.medications,
      emergencyNotes: snap.profile.emergencyNotes || null,
    },
    medicalSummary: {
      hospitalName: primarySummary?.hospitalName || null,
      doctorName: primarySummary?.doctorName || null,
      diseaseStartingYear: primarySummary?.diseaseStartingYear ? Number(primarySummary.diseaseStartingYear) : null,
      treatmentStatus: primarySummary?.treatmentStatus || null,
      checkupFiles: primarySummary?.checkupFiles || [],
      currentMedications: primarySummary?.currentMedications || [],
      entries: visibleSummaries,
    },
    emergencyContacts: snap.contacts.map((c) => ({
      name: c.name,
      phoneNumber: c.phoneNumber,
      email: c.email || null,
      relationship: c.relationship || null,
      isPrimary: !!c.isPrimary,
    })),
    };
  };

  const hydrate = async (t: string, currentUser?: User, silent = false) => {
    const [profileRes, summaryRes, contactsRes] = await Promise.all([
      api<any>("/me/medical-profile", "GET", t),
      api<any>("/me/medical-summary", "GET", t),
      api<Contact[]>("/me/emergency-contacts", "GET", t),
    ]);

    const activeUser = currentUser || user;
    setProfile(
      profileRes
        ? {
            bloodGroup: profileRes.bloodGroup || "",
            cnic: profileRes.cnic || activeUser?.cnic || "",
            age: profileRes.age !== undefined && profileRes.age !== null ? String(profileRes.age) : "",
            address: profileRes.address || activeUser?.address || "",
            allergies: arr(profileRes.allergies),
            chronicConditions: arr(profileRes.chronicConditions),
            medications: arr(profileRes.medications),
            emergencyNotes: profileRes.emergencyNotes || "",
            dateOfBirth: asDate(profileRes.dateOfBirth) || asDate(activeUser?.dateOfBirth),
            gender: profileRes.gender || activeUser?.gender || "",
          }
        : {
            ...EMPTY_PROFILE,
            cnic: activeUser?.cnic || "",
            address: activeUser?.address || "",
            dateOfBirth: asDate(activeUser?.dateOfBirth),
            gender: activeUser?.gender || "",
          },
    );

    const nextSummaries = summaryRes?.entries?.length
      ? sortSummaryEntries(
          summaryRes.entries.map((entry: any, index: number) =>
            normalizeSummaryEntry(entry, entry?.id || `summary-${index + 1}`),
          ),
        )
      : summaryRes
        ? [normalizeSummaryEntry(summaryRes, "summary-1")]
        : [];
    setSummaries(nextSummaries);
    setSummary(nextSummaries[0] || { ...EMPTY_SUMMARY, id: safeId() });

    setContacts(contactsRes || []);

    const qrRes = await api<QrData>("/me/qr", "GET", t);
    if (qrRes?.qrCodeDataUrl || qrRes?.emergencyUrl) {
      setQrSafe(qrRes);
    } else {
      try {
        setQrSafe(await api<QrData>("/me/qr/regenerate", "POST", t));
      } catch {
        const cached = db ? await getKV<QrData>(db, "qr_data") : null;
        setQrSafe(cached);
      }
    }

    if (!silent) setOk("Cloud data loaded.");
  };

  const syncQ = async () => {
    if (!db || !token || !isOnline || syncing.current) return;
    syncing.current = true;
    try {
      const rows = await listQ(db);
      if (!rows.length) {
        setQCount(0);
        return;
      }

      for (const row of rows) {
        let payload: any = null;
        try {
          payload = JSON.parse(row.payload);
        } catch {
          await delQ(db, row.id);
          continue;
        }

        try {
          if (row.kind === "profile_upsert") await api("/me/medical-profile", "PUT", token, payload);
          if (row.kind === "summary_upsert") await api("/me/medical-summary", "PUT", token, payload);
          if (row.kind === "contact_upsert") {
            const requestBody = toContactBody(payload);
            if (payload.id && !String(payload.id).startsWith("local-")) {
              await api(`/me/emergency-contacts/${payload.id}`, "PUT", token, requestBody);
            } else {
              await api("/me/emergency-contacts", "POST", token, requestBody);
            }
          }
          if (row.kind === "contact_delete" && payload.id && !String(payload.id).startsWith("local-")) {
            await api(`/me/emergency-contacts/${payload.id}`, "DELETE", token);
          }
          if (row.kind === "panic_alert") await api("/me/panic-alerts", "POST", token, payload);
          await delQ(db, row.id);
        } catch (e) {
          if (netErr(e)) break;
          await delQ(db, row.id);
        }
      }

      await updateQCount();
      await hydrate(token, user || undefined, true);
      setOk("Offline changes synced.");
    } finally {
      syncing.current = false;
    }
  };

  useEffect(() => {
    let active = true;
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    void (async () => {
      const localDb = await SQLite.openDatabaseAsync("resqid.db");
      await initDb(localDb);
      if (!active) return;

      setDb(localDb);
      setQCount((await listQ(localDb)).length);

      const cachedSnapshot = await getKV<Snapshot>(localDb, "snapshot");
      const cachedToken = await getKV<string>(localDb, "auth_token");
      const cachedUser = await getKV<User>(localDb, "auth_user");
      const cachedLockSettings = await getKV<{ isLockEnabled: boolean; lockPin: string }>(localDb, "lock_settings");
      if (!active) return;

      setSnapshot(cachedSnapshot);
      if (cachedLockSettings) {
        setIsLockEnabled(Boolean(cachedLockSettings.isLockEnabled));
        setLockPin(String(cachedLockSettings.lockPin || ""));
      }
      if (cachedToken && cachedUser) {
        setToken(cachedToken);
        setUser(cachedUser);
      }
      setReady(true);
    })();

    return () => {
      active = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  useEffect(() => {
    if (!ready || !token || !user) return;
    void hydrate(token, user, true);
  }, [ready, token, user?.id]);

  useEffect(() => {
    if (ready && token && user && isLockEnabled && lockPin) {
      setIsLocked(true);
    }
  }, [ready, token, user, isLockEnabled, lockPin]);

  useEffect(
    () => () => {
      Object.values(toastTimers.current).forEach((timer) => clearTimeout(timer));
      toastTimers.current = {};
    },
    [],
  );

  useEffect(() => {
    void syncQ();
  }, [db, token, isOnline]);

  useEffect(() => {
    if (!db) return;
    if (!token || !user) {
      void delKV(db, "auth_token");
      void delKV(db, "auth_user");
      return;
    }
    void setKV(db, "auth_token", token);
    void setKV(db, "auth_user", user);
  }, [db, token, user]);

  useEffect(() => {
    if (!db || !user) return;
    const snap: Snapshot = {
      user,
      profile,
      summary,
      summaries,
      contacts,
      qr,
      savedAt: new Date().toISOString(),
    };
    void setKV(db, "snapshot", snap);
    void setKV(db, "qr_data", qr);
    setSnapshot(snap);
  }, [db, user, profile, summary, summaries, contacts, qr]);

  useEffect(() => {
    if (!db) return;
    void setKV(db, "lock_settings", { isLockEnabled, lockPin });
  }, [db, isLockEnabled, lockPin]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && isLockEnabled && Boolean(token) && Boolean(user) && lockPin) {
        setIsLocked(true);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [isLockEnabled, token, user, lockPin]);

  const loginUser = () =>
    run(async () => {
      if (!isOnline) throw new Error("No internet. Use Offline Emergency View.");
      const nextErrors: Partial<Record<"email" | "password", string>> = {};
      if (!login.email.trim()) nextErrors.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login.email.trim())) nextErrors.email = "Please enter a valid email.";
      if (!login.password.trim()) nextErrors.password = "Password is required.";
      setLoginErrors(nextErrors);
      if (Object.keys(nextErrors).length) throw new Error(Object.values(nextErrors)[0] || "Invalid login details.");
      const response = await api<{ accessToken: string; user: User; message: string }>(
        "/auth/login",
        "POST",
        undefined,
        login,
      );
      setToken(response.accessToken);
      setUser(response.user);
      setLoginErrors({});
      setTab("home");
      if (isLockEnabled && lockPin) {
        setIsLocked(true);
      }
      await hydrate(response.accessToken, response.user);
      setOk(response.message || "Signed in.");
    });

  const registerUser = () =>
    run(async () => {
      if (!isOnline) throw new Error("Internet is required to register.");
      const nextErrors: AuthFieldErrors = {};
      if (!register.fullName.trim()) nextErrors.fullName = "Full name is required.";
      if (!register.email.trim()) nextErrors.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(register.email.trim())) nextErrors.email = "Please enter a valid email.";
      if (!register.phoneNumber.trim()) nextErrors.phoneNumber = "Phone number is required.";
      else if (!isValidPhoneNumber(register.phoneNumber)) nextErrors.phoneNumber = "Please enter a valid contact number.";
      if (!register.cnic.trim()) nextErrors.cnic = "CNIC is required.";
      else if (!isValidCnic(register.cnic)) nextErrors.cnic = "CNIC must be 12345-1234567-1.";
      if (!register.address.trim()) nextErrors.address = "Address is required.";
      if (!register.dateOfBirth.trim()) nextErrors.dateOfBirth = "Date of birth is required.";
      if (!register.gender.trim()) nextErrors.gender = "Gender is required.";
      if (!register.password) nextErrors.password = "Password is required.";
      else if (register.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
      if (!register.confirmPassword) nextErrors.confirmPassword = "Confirm password is required.";
      else if (register.password !== register.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
      setRegisterErrors(nextErrors);
      if (Object.keys(nextErrors).length) throw new Error(Object.values(nextErrors)[0] || "Invalid registration details.");

      const payload = {
        fullName: register.fullName.trim(),
        email: register.email.trim().toLowerCase(),
        phoneNumber: register.phoneNumber.trim(),
        cnic: register.cnic.trim(),
        address: register.address.trim(),
        dateOfBirth: register.dateOfBirth.trim(),
        gender: register.gender.trim().toLowerCase(),
        password: register.password,
      };
      const response = await api<{ accessToken: string; user: User; message: string }>(
        "/auth/register",
        "POST",
        undefined,
        payload,
      );
      setToken(response.accessToken);
      setUser(response.user);
      setRegisterErrors({});
      setLogin({ email: payload.email, password: payload.password });
      setTab("home");
      resetRegisterForm();
      if (isLockEnabled && lockPin) {
        setIsLocked(true);
      }
      await hydrate(response.accessToken, response.user);
      setOk(response.message || "Account created.");
    });

  const requestPasswordReset = () =>
    run(async () => {
      if (!isOnline) throw new Error("Internet is required to request password reset.");
      const email = forgotEmail.trim().toLowerCase();
      if (!email) {
        setForgotEmailError("Email is required.");
        throw new Error("Email is required.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setForgotEmailError("Please enter a valid email.");
        throw new Error("Please enter a valid email.");
      }

      const response = await api<{ message: string; resetCode?: string; usedFallback?: boolean }>(
        "/auth/forgot-password",
        "POST",
        undefined,
        { email },
      );
      setForgotEmailError("");
      setLogin((prev) => ({ ...prev, email }));
      if (response.resetCode) {
        await Clipboard.setStringAsync(response.resetCode);
        setResetCodeInput(response.resetCode);
        setInfo("Reset code copied because email delivery is not configured on this server.");
      }
      setOk(response.message || "Password reset code sent.");
      setAuthScreen("verifyReset");
    });

  const verifyResetCodeInApp = () =>
    run(async () => {
      if (!isOnline) throw new Error("Internet is required to verify reset code.");
      const email = forgotEmail.trim().toLowerCase();
      const code = resetCodeInput.trim();
      if (!email) throw new Error("Email is required.");
      if (!code) throw new Error("Reset code is required.");
      if (!/^\d{6}$/.test(code)) throw new Error("Reset code must be 6 digits.");

      const response = await api<{ message: string }>(
        "/auth/verify-reset-code",
        "POST",
        undefined,
        { email, code },
      );
      setOk(response.message || "Reset code verified.");
      setAuthScreen("reset");
    });

  const resetPasswordInApp = () =>
    run(async () => {
      if (!isOnline) throw new Error("Internet is required to reset password.");
      const email = forgotEmail.trim().toLowerCase();
      const code = resetCodeInput.trim();
      if (!email) throw new Error("Email is required.");
      if (!code) throw new Error("Reset code is required.");
      if (!resetPassword) throw new Error("New password is required.");
      if (resetPassword.length < 8) throw new Error("Password must be at least 8 characters.");
      if (!resetConfirmPassword) throw new Error("Confirm password is required.");
      if (resetPassword !== resetConfirmPassword) throw new Error("Passwords do not match.");

      const response = await api<{ message: string }>(
        "/auth/reset-password",
        "POST",
        undefined,
        { email, code, newPassword: resetPassword },
      );
      setLogin((prev) => ({ ...prev, email: forgotEmail.trim().toLowerCase(), password: "" }));
      resetResetPasswordForm();
      setAuthScreen("login");
      setOk(response.message || "Password has been reset.");
    });

  const saveProfileCore = async () => {
    if (profile.cnic.trim() && !isValidCnic(profile.cnic)) {
      throw new Error("CNIC format must be 12345-1234567-1.");
    }
    if (profile.age.trim() && toNumericAge(profile.age) === null) {
      throw new Error("Age must be a whole number between 1 and 120.");
    }
    const payload = {
      bloodGroup: profile.bloodGroup || undefined,
      cnic: profile.cnic.trim() || undefined,
      age: profile.age.trim() ? Number(profile.age.trim()) : undefined,
      address: profile.address.trim() || undefined,
      allergies: profile.allergies,
      chronicConditions: profile.chronicConditions,
      medications: profile.medications,
      emergencyNotes: profile.emergencyNotes || undefined,
      dateOfBirth: profile.dateOfBirth || undefined,
      gender: profile.gender || undefined,
    };
    if (isOnline) {
      try {
        await api("/me/medical-profile", "PUT", token, payload);
        return "Profile saved.";
      } catch (e) {
        if (!netErr(e)) throw e;
      }
    }
    await queue("profile_upsert", payload);
    return "Profile saved offline.";
  };

  const saveSummaryCore = async () => {
    const entries = getActiveSummaries();
    for (const item of entries) {
      const parsedYear = item.diseaseStartingYear.trim() ? toNumericYear(item.diseaseStartingYear.trim()) : null;
      if (item.diseaseStartingYear.trim() && parsedYear === null) {
        throw new Error(`Disease starting year must be between 1900 and ${new Date().getFullYear()}.`);
      }
      if (item.checkupFiles.some((file) => !isPdfReference(file))) {
        throw new Error("Checkup files must be PDF files (ending with .pdf).");
      }
    }
    const primary = entries[0];
    const payload = {
      hospitalName: primary?.hospitalName || undefined,
      doctorName: primary?.doctorName || undefined,
      diseaseStartingYear: primary?.diseaseStartingYear.trim()
        ? toNumericYear(primary.diseaseStartingYear.trim()) ?? undefined
        : undefined,
      treatmentDuration: primary?.treatmentDuration || undefined,
      treatmentStatus: primary?.treatmentStatus || undefined,
      checkupFiles: primary?.checkupFiles || [],
      currentMedications: primary?.currentMedications || [],
      notes: primary?.notes || undefined,
      entries: entries.map((item) => ({
        id: item.id,
        hospitalName: item.hospitalName || undefined,
        doctorName: item.doctorName || undefined,
        diseaseStartingYear: item.diseaseStartingYear.trim()
          ? toNumericYear(item.diseaseStartingYear.trim()) ?? undefined
          : undefined,
        treatmentDuration: item.treatmentDuration || undefined,
        treatmentStatus: item.treatmentStatus || undefined,
        checkupFiles: item.checkupFiles,
        currentMedications: item.currentMedications,
        notes: item.notes || undefined,
      })),
    };
    setSummaries(entries);
    clearSummaryDraft();
    if (isOnline) {
      try {
        await api("/me/medical-summary", "PUT", token, payload);
        return "Summary saved.";
      } catch (e) {
        if (!netErr(e)) throw e;
      }
    }
    await queue("summary_upsert", payload);
    return "Summary saved offline.";
  };

  const saveMedical = () =>
    run(async () => {
      const [profileMsg, summaryMsg] = await Promise.all([saveProfileCore(), saveSummaryCore()]);
      const savedOffline = /offline/i.test(profileMsg) || /offline/i.test(summaryMsg);
      setOk(savedOffline ? "Profile saved offline." : "Profile saved.");
    });

  const saveContact = () =>
    run(async () => {
      if (!contactForm.name.trim() || !contactForm.phoneNumber.trim()) {
        throw new Error("Name and contact number are required.");
      }
      if (!isValidPhoneNumber(contactForm.phoneNumber)) {
        throw new Error("Contact number format is invalid.");
      }
      if (!contactForm.email.trim()) {
        throw new Error("Email is required.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())) {
        throw new Error("Please enter a valid email address.");
      }
      if (!contactForm.id && contacts.length >= 5) {
        throw new Error("You can add up to 5 emergency contacts.");
      }

      const payload = {
        id: contactForm.id || `local-${Date.now()}`,
        name: contactForm.name.trim(),
        phoneNumber: contactForm.phoneNumber.trim(),
        email: contactForm.email.trim().toLowerCase(),
        relationship: contactForm.relationship.trim() || undefined,
        isPrimary: contactForm.isPrimary,
      };
      const requestBody = toContactBody(payload);

      const applyLocal = () => setContacts((prev) => [...prev.filter((item) => item.id !== payload.id), payload]);

      if (isOnline) {
        try {
          if (contactForm.id && !contactForm.id.startsWith("local-")) {
            await api(`/me/emergency-contacts/${contactForm.id}`, "PUT", token, requestBody);
          } else {
            await api("/me/emergency-contacts", "POST", token, requestBody);
          }
          setContacts(await api<Contact[]>("/me/emergency-contacts", "GET", token));
          setShowContactForm(false);
          setContactForm({ id: "", name: "", phoneNumber: "", email: "", relationship: "", isPrimary: false });
          setOk("Contact saved.");
          return;
        } catch (e) {
          if (!netErr(e)) throw e;
        }
      }

      applyLocal();
      await queue("contact_upsert", payload);
      setShowContactForm(false);
      setContactForm({ id: "", name: "", phoneNumber: "", email: "", relationship: "", isPrimary: false });
      setOk("Contact saved offline.");
    });

  const deleteContact = (id: string) =>
    Alert.alert("Delete Contact", "Delete this contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          run(async () => {
            setContacts((prev) => prev.filter((x) => x.id !== id));
            if (contactForm.id === id) {
              setShowContactForm(false);
              setContactForm({ id: "", name: "", phoneNumber: "", email: "", relationship: "", isPrimary: false });
            }
            if (isOnline && !id.startsWith("local-")) {
              try {
                await api(`/me/emergency-contacts/${id}`, "DELETE", token);
                setOk("Contact deleted.");
                return;
              } catch (e) {
                if (!netErr(e)) throw e;
              }
            }
            if (!id.startsWith("local-")) await queue("contact_delete", { id });
            setInfo("Delete queued for sync.");
          }),
      },
    ]);

  const getLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") throw new Error("Location permission is required.");

    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch {
      const last = await Location.getLastKnownPositionAsync();
      if (!last) throw new Error("Unable to read GPS location.");
      return { latitude: last.coords.latitude, longitude: last.coords.longitude };
    }
  };

  const sendSos = () =>
    run(async () => {
      const loc = await getLocation();
      setLastLoc(loc);

      const payload = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        message: panicMsg.trim() || undefined,
      };
      if (isOnline) {
        try {
          const response = await api<{ warning?: string }>("/me/panic-alerts", "POST", token, payload);
          setShowSos(false);
          setPanicMsg("");
          await scheduleAlertNotification(
            "ResQID emergency alert",
            response?.warning || "Your emergency alert was processed.",
          );
          setOk(response?.warning || "Emergency alert sent.");
          return;
        } catch (e) {
          if (!netErr(e)) throw e;
        }
      }

      await queue("panic_alert", payload);
      setShowSos(false);
      setPanicMsg("");
      await scheduleAlertNotification("ResQID alert queued", "Your SOS alert was saved offline and will sync automatically.");
      setInfo("SOS queued offline and will sync automatically.");
    });

  const regenQr = () =>
    run(async () => {
      if (!isOnline) throw new Error("Internet is required for QR regenerate.");
      setQrSafe(await api<QrData>("/me/qr/regenerate", "POST", token));
      setOk("QR regenerated.");
    });
  const copyEmergencyUrl = () =>
    run(async () => {
      const emergencyUrl = normalizeEmergencyUrl(qr?.emergencyUrl);
      if (!emergencyUrl) throw new Error("No emergency URL available yet.");
      await Clipboard.setStringAsync(emergencyUrl);
      setOk("Emergency URL copied.");
    });
  const openEmergencyUrl = () =>
    run(async () => {
      const emergencyUrl = normalizeEmergencyUrl(qr?.emergencyUrl);
      if (!emergencyUrl) throw new Error("No emergency URL available yet.");
      const canOpen = await Linking.canOpenURL(emergencyUrl);
      if (!canOpen) throw new Error("Cannot open this emergency URL on this device.");
      await Linking.openURL(emergencyUrl);
    });

  const openScanner = () =>
    run(async () => {
      const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
      if (!permission.granted) throw new Error("Camera permission is required.");
      setScannerLocked(false);
      setShowScanner(true);
    });

  const resolvePublic = async (raw: string) => {
    const emergencyToken = tokenFrom(raw);
    if (!emergencyToken) throw new Error("Provide a valid token or URL.");

    if (isOnline) {
      setPublicData(await api<PublicData>(`/emergency-access/${emergencyToken}/data`));
      return;
    }

    if (snapshot?.qr?.emergencyUrl && tokenFrom(snapshot.qr.emergencyUrl) === emergencyToken) {
      setPublicData(toPublic(snapshot));
      return;
    }

    throw new Error("Offline public access only works for cached local QR.");
  };

  const onScanned = (result: BarcodeScanningResult) => {
    if (scannerLocked) return;
    setScannerLocked(true);
    setShowScanner(false);
    const scanned = tokenFrom(result.data || "");
    setPublicInput(scanned);
    void run(async () => {
      try {
        await resolvePublic(scanned);
        setOk("QR scanned successfully.");
      } finally {
        setScannerLocked(false);
      }
    });
  };

  const addProfileItem = (key: "allergies" | "chronicConditions" | "medications", raw: string, clear: () => void) => {
    const value = raw.trim();
    if (!value) return;
    setProfile((prev) => ({
      ...prev,
      [key]: [...prev[key], value],
    }));
    clear();
  };

  const removeProfileItem = (key: "allergies" | "chronicConditions" | "medications", value: string) => {
    setProfile((prev) => ({
      ...prev,
      [key]: prev[key].filter((item) => item !== value),
    }));
  };

  const addSummaryMedication = () => {
    const value = smDraft.trim();
    if (!value) return;
    setSummary((prev) => ({ ...prev, currentMedications: [...prev.currentMedications, value] }));
    setSmDraft("");
  };

  const removeSummaryMedication = (value: string) => {
    setSummary((prev) => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((item) => item !== value),
    }));
  };

  const addCheckupFile = () => {
    const value = checkupFileDraft.trim();
    if (!value) return;
    if (!isPdfReference(value)) {
      pushToast("Only PDF files are allowed for checkup uploads.", "error");
      return;
    }
    setSummary((prev) => ({
      ...prev,
      checkupFiles: [...prev.checkupFiles, value],
    }));
    setCheckupFileDraft("");
  };

  const uploadCheckupFile = () =>
    run(async () => {
      if (!isOnline) throw new Error("Internet is required to upload a PDF.");
      let pickerModule: any = null;
      try {
        pickerModule = require("expo-document-picker");
      } catch {
        throw new Error("PDF picker is not installed in this local app build yet.");
      }
      const picked = await pickerModule.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.length) return;
      const file = picked.assets[0];
      if (!isPdfReference(file.name || file.uri || "")) {
        throw new Error("Only PDF files are allowed.");
      }

      const form = new FormData();
      form.append("file", {
        uri: file.uri,
        name: file.name || `checkup-${Date.now()}.pdf`,
        type: "application/pdf",
      } as any);

      const res = await fetch(`${ACTIVE_API}/me/medical-summary/checkup-files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Unable to upload checkup PDF.");
      }

      setSummary((prev) => ({
        ...prev,
        checkupFiles: [...prev.checkupFiles, String(data?.path || data?.url || "").trim()].filter(Boolean),
      }));
      setOk("Checkup PDF uploaded.");
    });

  const downloadCheckupFile = (value: string) =>
    run(async () => {
      const url = resolveCheckupDownloadUrl(value) || resolveAssetUrl(value);
      if (!url) throw new Error("No PDF URL available.");
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) throw new Error("Cannot open this PDF on this device.");
      await Linking.openURL(url);
    });

  const saveSummaryDraft = () => {
    const nextDraft = { ...summary, id: summary.id || safeId() };
    if (!hasSummaryContent(nextDraft)) {
      pushToast("Add summary details before saving an entry.", "error");
      return;
    }
    const editingExisting = summaries.some((item) => item.id === nextDraft.id);
    const nextEntries = mergeSummaryDraft(summaries, nextDraft);
    setSummaries(nextEntries);
    clearSummaryDraft();
    setOk(editingExisting ? "Summary entry updated." : "Summary entry added.");
  };

  const editSummaryEntry = (entry: Summary) => {
    setSummary(entry);
    setCheckupFileDraft("");
    setSmDraft("");
    setTab("profile");
    requestAnimationFrame(() => {
      mainScrollRef.current?.scrollTo({ y: 900, animated: true });
    });
  };

  const deleteSummaryEntry = (id: string) => {
    setSummaries((prev) => prev.filter((item) => item.id !== id));
    if (summary.id === id) {
      clearSummaryDraft();
    }
    setInfo("Summary entry removed.");
  };

  const removeCheckupFile = (value: string) => {
    setSummary((prev) => ({
      ...prev,
      checkupFiles: prev.checkupFiles.filter((item) => item !== value),
    }));
  };

  const enableLock = () => {
    const pin = lockPinDraft.trim();
    const confirm = lockPinConfirm.trim();
    if (!/^\d{4}$/.test(pin)) {
      setLockHint("PIN must be exactly 4 digits.");
      return;
    }
    if (pin !== confirm) {
      setLockHint("PIN and confirmation do not match.");
      return;
    }
    setLockPin(pin);
    setIsLockEnabled(true);
    setLockPinDraft("");
    setLockPinConfirm("");
    setUnlockPin("");
    setLockHint("2-step lock enabled.");
    setOk("2-step lock enabled.");
  };

  const disableLock = () => {
    setIsLockEnabled(false);
    setLockPin("");
    setLockPinDraft("");
    setLockPinConfirm("");
    setUnlockPin("");
    setIsLocked(false);
    setLockHint("2-step lock disabled.");
    setInfo("2-step lock disabled.");
  };

  const unlockApp = () => {
    if (!isLockEnabled) {
      setIsLocked(false);
      return;
    }
    if (unlockPin.trim() !== lockPin) {
      setLockHint("Incorrect PIN. Please try again.");
      return;
    }
    setUnlockPin("");
    setIsLocked(false);
    setLockHint("");
  };

  const openContactEditor = (contact?: Contact) => {
    if (!contact) {
      setContactForm({ id: "", name: "", phoneNumber: "", email: "", relationship: "", isPrimary: false });
    } else {
      setContactForm({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        email: contact.email || "",
        relationship: contact.relationship || "",
        isPrimary: !!contact.isPrimary,
      });
    }
    setShowContactForm(true);
    requestAnimationFrame(() => {
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  const logout = () => {
    setToken("");
    setUser(null);
    setContacts([]);
    setQr(null);
    setShowScanner(false);
    setPublicData(null);
    setPublicInput("");
    setProfile(EMPTY_PROFILE);
    setSummary({ ...EMPTY_SUMMARY, id: safeId() });
    setSummaries([]);
    setAuthScreen("login");
    setTab("home");
    setIsLocked(false);
    setUnlockPin("");
    setInfo("Logged out.");
  };

  const visibleEmergencyUrl = normalizeEmergencyUrl(qr?.emergencyUrl);
  const isEditingSummaryEntry = summaries.some((item) => item.id === summary.id);

  if (!ready) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="dark" />
        <View style={s.bootWrap}>
          <View style={s.logoSquare}>
            <Ionicons name="shield-checkmark-outline" size={36} color="#fff" />
          </View>
          <Text style={s.bootTitle}>ResQID</Text>
          <Text style={s.bootSub}>Preparing emergency data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!token || !user) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={s.authWrap} keyboardShouldPersistTaps="handled">
          <View style={s.logoBlock}>
            <View style={s.logoSquare}>
              <Ionicons name="shield-checkmark-outline" size={36} color="#fff" />
            </View>
            <Text style={s.logoTitle}>ResQID</Text>
            <Text style={s.logoSub}>Emergency Medical ID</Text>
          </View>

          {authScreen === "login" && (
            <View style={s.formWrap}>
              <Text style={s.formLabel}>Email</Text>
              <Field
                icon="mail-outline"
                placeholder="Enter your email"
                value={login.email}
                onChangeText={(v) => {
                  setLogin((p) => ({ ...p, email: v }));
                  setLoginErrors((p) => ({ ...p, email: undefined }));
                }}
                keyboardType="email-address"
              />
              {!!loginErrors.email && <Text style={s.fieldError}>{loginErrors.email}</Text>}
              <Text style={s.formLabel}>Password</Text>
              <Field
                icon="lock-closed-outline"
                placeholder="Enter your password"
                value={login.password}
                onChangeText={(v) => {
                  setLogin((p) => ({ ...p, password: v }));
                  setLoginErrors((p) => ({ ...p, password: undefined }));
                }}
                secureTextEntry={!showLoginPassword}
                right={
                  <Pressable onPress={() => setShowLoginPassword((v) => !v)}>
                    <Ionicons
                      name={showLoginPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#6b7280"
                    />
                  </Pressable>
                }
              />
              {!!loginErrors.password && <Text style={s.fieldError}>{loginErrors.password}</Text>}
              <Text
                style={s.linkSoft}
                onPress={() => {
                  setForgotEmail(login.email.trim());
                  setForgotEmailError("");
                  setAuthScreen("forgot");
                }}
              >
                Forgot password?
              </Text>
              <Pressable style={[s.primaryBtn, busy && s.primaryBtnDisabled]} disabled={busy} onPress={loginUser}>
                <Text style={s.primaryBtnText}>{busy ? "Signing In..." : "Sign In"}</Text>
              </Pressable>
              <Text style={s.centerText}>
                Don't have an account?{" "}
                <Text style={s.link} onPress={() => { resetRegisterForm(); setAuthScreen("register"); }}>Create Account</Text>
              </Text>
              <Text style={s.linkSoft} onPress={() => setAuthScreen("public")}>Scan a QR code without login</Text>
            </View>
          )}

          {authScreen === "register" && (
            <View style={s.formWrap}>
              <View style={s.authTop}>
                <Pressable onPress={() => { resetRegisterForm(); setAuthScreen("login"); }}>
                  <Ionicons name="chevron-back" size={24} color="#6b7280" />
                </Pressable>
                <View>
                  <Text style={s.authTitle}>Create Account</Text>
                  <Text style={s.authSub}>Set up your emergency profile</Text>
                </View>
              </View>

              <Text style={s.formLabel}>Full Name</Text>
              <Field
                icon="person-outline"
                placeholder="Enter your full name"
                value={register.fullName}
                onChangeText={(v) => {
                  setRegister((p) => ({ ...p, fullName: v }));
                  setRegisterErrors((p) => ({ ...p, fullName: undefined }));
                }}
                autoCapitalize="words"
              />
              {!!registerErrors.fullName && <Text style={s.fieldError}>{registerErrors.fullName}</Text>}
              <Text style={s.formLabel}>Email</Text>
              <Field
                icon="mail-outline"
                placeholder="Enter your email"
                value={register.email}
                onChangeText={(v) => {
                  setRegister((p) => ({ ...p, email: v }));
                  setRegisterErrors((p) => ({ ...p, email: undefined }));
                }}
                keyboardType="email-address"
              />
              {!!registerErrors.email && <Text style={s.fieldError}>{registerErrors.email}</Text>}
              <Text style={s.formLabel}>Phone Number</Text>
              <Field
                icon="call-outline"
                placeholder="+92 300 1234567"
                value={register.phoneNumber}
                onChangeText={(v) => {
                  setRegister((p) => ({ ...p, phoneNumber: v.replace(/[^0-9()+\-\s]/g, "") }));
                  setRegisterErrors((p) => ({ ...p, phoneNumber: undefined }));
                }}
                keyboardType="phone-pad"
              />
              {!!registerErrors.phoneNumber && <Text style={s.fieldError}>{registerErrors.phoneNumber}</Text>}
              <Text style={s.formLabel}>CNIC</Text>
              <Field
                icon="document-text-outline"
                placeholder="12345-1234567-1"
                value={register.cnic}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, "").slice(0, 13);
                  const formatted = [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)]
                    .filter(Boolean)
                    .join("-");
                  setRegister((p) => ({ ...p, cnic: formatted }));
                  setRegisterErrors((p) => ({ ...p, cnic: undefined }));
                }}
                keyboardType="number-pad"
              />
              {!!registerErrors.cnic && <Text style={s.fieldError}>{registerErrors.cnic}</Text>}
              <Text style={s.formLabel}>Address</Text>
              <Field
                icon="home-outline"
                placeholder="House, street, city"
                value={register.address}
                onChangeText={(v) => {
                  setRegister((p) => ({ ...p, address: v }));
                  setRegisterErrors((p) => ({ ...p, address: undefined }));
                }}
                multiline
              />
              {!!registerErrors.address && <Text style={s.fieldError}>{registerErrors.address}</Text>}

              <View style={s.rowGap}>
                <View style={s.flexOne}>
                  <Text style={s.formLabel}>Date of Birth</Text>
                  <Pressable style={s.fieldWrap} onPress={() => setShowRegisterDobPicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    <Text style={register.dateOfBirth ? s.datePickerText : s.datePickerPlaceholder}>
                      {register.dateOfBirth || "Select date of birth"}
                    </Text>
                  </Pressable>
                  {!!registerErrors.dateOfBirth && <Text style={s.fieldError}>{registerErrors.dateOfBirth}</Text>}
                </View>
                <View style={s.flexOne}>
                  <Text style={s.formLabel}>Gender</Text>
                  <View style={s.genderRow}>
                    {GENDERS.map((g) => (
                      <Pressable
                        key={g}
                        style={[s.genderChip, register.gender === g && s.genderChipOn]}
                        onPress={() => {
                          setRegister((p) => ({ ...p, gender: g }));
                          setRegisterErrors((p) => ({ ...p, gender: undefined }));
                        }}
                      >
                        <Text style={[s.genderChipText, register.gender === g && s.genderChipTextOn]}>{g}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {!!registerErrors.gender && <Text style={s.fieldError}>{registerErrors.gender}</Text>}
                </View>
              </View>
              {showRegisterDobPicker && (
                <DateTimePicker
                  value={ymdToDate(register.dateOfBirth)}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={onRegisterDobChange}
                />
              )}

              <Text style={s.formLabel}>Password</Text>
              <Field
                icon="lock-closed-outline"
                placeholder="Create a password"
                value={register.password}
                onChangeText={(v) => {
                  setRegister((p) => ({ ...p, password: v }));
                  setRegisterErrors((p) => ({ ...p, password: undefined }));
                }}
                secureTextEntry={!showRegPassword}
                right={
                  <Pressable onPress={() => setShowRegPassword((v) => !v)}>
                    <Ionicons
                      name={showRegPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#6b7280"
                    />
                  </Pressable>
                }
              />
              {!!registerErrors.password && <Text style={s.fieldError}>{registerErrors.password}</Text>}
              <Text style={s.formLabel}>Confirm Password</Text>
              <Field
                icon="lock-closed-outline"
                placeholder="Confirm your password"
                value={register.confirmPassword}
                onChangeText={(v) => {
                  setRegister((p) => ({ ...p, confirmPassword: v }));
                  setRegisterErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
                secureTextEntry={!showRegConfirm}
                right={
                  <Pressable onPress={() => setShowRegConfirm((v) => !v)}>
                    <Ionicons
                      name={showRegConfirm ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#6b7280"
                    />
                  </Pressable>
                }
              />
              {!!registerErrors.confirmPassword && <Text style={s.fieldError}>{registerErrors.confirmPassword}</Text>}

              <Pressable style={[s.primaryBtn, busy && s.primaryBtnDisabled]} disabled={busy} onPress={registerUser}>
                <Text style={s.primaryBtnText}>{busy ? "Creating..." : "Create Account"}</Text>
              </Pressable>
              <Text style={s.centerText}>
                Already have an account? <Text style={s.link} onPress={() => { resetRegisterForm(); setAuthScreen("login"); }}>Sign In</Text>
              </Text>
            </View>
          )}

          {authScreen === "forgot" && (
            <View style={s.formWrap}>
              <View style={s.authTop}>
                <Pressable onPress={() => setAuthScreen("login")}>
                  <Ionicons name="chevron-back" size={24} color="#6b7280" />
                </Pressable>
                <View>
                  <Text style={s.authTitle}>Forgot Password</Text>
                  <Text style={s.authSub}>We will send a 6-digit code to your email</Text>
                </View>
              </View>

              <Text style={s.formLabel}>Email</Text>
              <Field
                icon="mail-outline"
                placeholder="Enter your account email"
                value={forgotEmail}
                onChangeText={(v) => {
                  setForgotEmail(v);
                  setForgotEmailError("");
                }}
                keyboardType="email-address"
              />
              {!!forgotEmailError && <Text style={s.fieldError}>{forgotEmailError}</Text>}
              <Pressable style={[s.primaryBtn, busy && s.primaryBtnDisabled]} disabled={busy} onPress={requestPasswordReset}>
                <Text style={s.primaryBtnText}>{busy ? "Submitting..." : "Send Reset Code"}</Text>
              </Pressable>
              <Text style={s.linkSoft} onPress={() => setAuthScreen("verifyReset")}>Already have a reset code?</Text>
            </View>
          )}

          {authScreen === "verifyReset" && (
            <View style={s.formWrap}>
              <View style={s.authTop}>
                <Pressable onPress={() => setAuthScreen("forgot")}>
                  <Ionicons name="chevron-back" size={24} color="#6b7280" />
                </Pressable>
                <View>
                  <Text style={s.authTitle}>Verify Code</Text>
                  <Text style={s.authSub}>Enter the 6-digit code sent to your email</Text>
                </View>
              </View>

              <Text style={s.formLabel}>Reset Code</Text>
              <Field
                icon="key-outline"
                placeholder="Enter 6-digit code"
                value={resetCodeInput}
                onChangeText={(v) => setResetCodeInput(v.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
              />
              <Pressable style={[s.primaryBtn, busy && s.primaryBtnDisabled]} disabled={busy} onPress={verifyResetCodeInApp}>
                <Text style={s.primaryBtnText}>{busy ? "Checking..." : "Verify Code"}</Text>
              </Pressable>
            </View>
          )}

          {authScreen === "reset" && (
            <View style={s.formWrap}>
              <View style={s.authTop}>
                <Pressable onPress={() => setAuthScreen("verifyReset")}>
                  <Ionicons name="chevron-back" size={24} color="#6b7280" />
                </Pressable>
                <View>
                  <Text style={s.authTitle}>New Password</Text>
                  <Text style={s.authSub}>Set your new password after code verification</Text>
                </View>
              </View>

              <Text style={s.formLabel}>New Password</Text>
              <Field
                icon="lock-closed-outline"
                placeholder="Enter new password"
                value={resetPassword}
                onChangeText={setResetPassword}
                secureTextEntry={!showResetPassword}
                right={
                  <Pressable onPress={() => setShowResetPassword((v) => !v)}>
                    <Ionicons
                      name={showResetPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#6b7280"
                    />
                  </Pressable>
                }
              />
              <Text style={s.formLabel}>Confirm Password</Text>
              <Field
                icon="lock-closed-outline"
                placeholder="Confirm new password"
                value={resetConfirmPassword}
                onChangeText={setResetConfirmPassword}
                secureTextEntry={!showResetConfirmPassword}
                right={
                  <Pressable onPress={() => setShowResetConfirmPassword((v) => !v)}>
                    <Ionicons
                      name={showResetConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#6b7280"
                    />
                  </Pressable>
                }
              />
              <Pressable style={[s.primaryBtn, busy && s.primaryBtnDisabled]} disabled={busy} onPress={resetPasswordInApp}>
                <Text style={s.primaryBtnText}>{busy ? "Updating..." : "Reset Password"}</Text>
              </Pressable>
            </View>
          )}

          {authScreen === "public" && (
            <View style={s.formWrap}>
              <View style={s.authTop}>
                <Pressable onPress={() => setAuthScreen("login")}>
                  <Ionicons name="chevron-back" size={24} color="#6b7280" />
                </Pressable>
                <Text style={s.authTitle}>Emergency QR Access</Text>
              </View>
              {showScanner ? (
                <View style={s.scannerWrap}>
                  {cameraPermission?.granted ? (
                    <CameraView
                      style={s.scanner}
                      onBarcodeScanned={scannerLocked ? undefined : onScanned}
                      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    />
                  ) : (
                    <View style={s.scannerFallback}>
                      <Ionicons name="camera-outline" size={28} color="#6b7280" />
                      <Text style={s.scannerFallbackText}>Camera access is required for QR scanning.</Text>
                      <Pressable style={s.subtleBtn} onPress={openScanner}>
                        <Text style={s.subtleBtnText}>Grant Camera Access</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <Field
                    icon="qr-code-outline"
                    placeholder="Paste QR URL or token"
                    value={publicInput}
                    onChangeText={setPublicInput}
                  />
                  <Pressable
                    style={s.primaryBtn}
                    onPress={() =>
                      run(async () => {
                        await resolvePublic(publicInput);
                        setOk("Emergency profile opened.");
                      })
                    }
                  >
                    <Text style={s.primaryBtnText}>{busy ? "Opening..." : "Open Emergency Profile"}</Text>
                  </Pressable>
                  <Pressable style={s.subtleBtn} onPress={openScanner}>
                    <Text style={s.subtleBtnText}>Scan QR with Camera</Text>
                  </Pressable>
                  {publicData && (
                    <View style={s.publicCard}>
                      <Text style={s.publicName}>{publicData.user?.fullName || "Unknown User"}</Text>
                      <Text style={s.publicLine}>Blood Group: {publicData.medicalProfile?.bloodGroup || "Not set"}</Text>
                      <Text style={s.publicLine}>CNIC: {publicData.medicalProfile?.cnic || "Not set"}</Text>
                      <Text style={s.publicLine}>Age: {publicData.medicalProfile?.age || "Not set"}</Text>
                      <Text style={s.publicLine}>Address: {publicData.medicalProfile?.address || "Not set"}</Text>
                      <Text style={s.publicLine}>Allergies: {publicData.medicalProfile?.allergies?.join(", ") || "None"}</Text>
                      <Text style={s.publicLine}>Conditions: {publicData.medicalProfile?.chronicConditions?.join(", ") || "None"}</Text>
                      <Text style={s.publicLine}>Disease Start Year: {publicData.medicalSummary?.diseaseStartingYear || "Not set"}</Text>
                      <Text style={s.publicLine}>Contacts: {publicData.emergencyContacts?.length || 0}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          <Text style={s.apiHint}>API: {API}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
        <View pointerEvents="box-none" style={s.toastWrap}>
          {toasts.map((toast) => (
            <Pressable
              key={toast.id}
              onPress={() => dismissToast(toast.id)}
              style={[
                s.toastCard,
                toast.tone === "success" && s.toastSuccess,
                toast.tone === "error" && s.toastError,
                toast.tone === "info" && s.toastInfo,
              ]}
            >
              <Text style={s.toastText}>{toast.message}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 22}
      >
      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={[s.page, (tab === "profile" || tab === "contacts") && s.pageForm]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={s.onlineText}>{isOnline ? "Online" : "Offline"} | Pending sync: {qCount}</Text>

        {tab === "home" && (
          <>
            <View style={s.homeTopRow}>
              <View style={s.brandMini}>
                <View style={s.brandMiniIcon}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                </View>
                <Text style={s.brandMiniTitle}>ResQID</Text>
              </View>
              <View style={s.homeActions}>
                <Pressable style={s.homeIconBtn} onPress={logout}>
                  <Ionicons name="settings-outline" size={22} color="#6b7280" />
                </Pressable>
              </View>
            </View>

            <Text style={s.homeHello}>Hello, {firstName}</Text>
            <Text style={s.homeSub}>Your emergency profile is ready</Text>

            {publicData && (
              <View style={s.publicCard}>
                <Text style={s.publicName}>{publicData.user?.fullName || "Scanned User"}</Text>
                <Text style={s.publicLine}>Blood Group: {publicData.medicalProfile?.bloodGroup || "Not set"}</Text>
                <Text style={s.publicLine}>CNIC: {publicData.medicalProfile?.cnic || "Not set"}</Text>
                <Text style={s.publicLine}>Age: {publicData.medicalProfile?.age || "Not set"}</Text>
                <Text style={s.publicLine}>Address: {publicData.medicalProfile?.address || "Not set"}</Text>
              </View>
            )}

            <View style={s.statGrid}>
              <View style={s.statCard}>
                <View style={s.statIconBubble}><MaterialCommunityIcons name="water-outline" size={18} color="#ef4444" /></View>
                <Text style={s.statValue}>{profile.bloodGroup || "Not set"}</Text>
                <Text style={s.statLabel}>Blood Group</Text>
              </View>
              <View style={s.statCard}>
                <View style={s.statIconBubble}><Ionicons name="warning-outline" size={18} color="#d97706" /></View>
                <Text style={s.statValue}>{profile.allergies.length}</Text>
                <Text style={s.statLabel}>Allergies</Text>
              </View>
              <View style={s.statCard}>
                <View style={s.statIconBubble}><Ionicons name="medkit-outline" size={18} color="#2563eb" /></View>
                <Text style={s.statValue}>{profile.medications.length}</Text>
                <Text style={s.statLabel}>Medications</Text>
              </View>
              <View style={s.statCard}>
                <View style={s.statIconBubble}><Ionicons name="heart-outline" size={18} color="#16a34a" /></View>
                <Text style={s.statValue}>{profile.chronicConditions.length}</Text>
                <Text style={s.statLabel}>Conditions</Text>
              </View>
            </View>

            <View style={s.sectionCard}>
              <Text style={s.sectionCardTitle}>Profile Highlights</Text>
              <Text style={s.publicLine}>Allergies: {joinOrFallback(profile.allergies)}</Text>
              <Text style={s.publicLine}>Conditions: {joinOrFallback(profile.chronicConditions)}</Text>
              <Text style={s.publicLine}>Medications: {joinOrFallback(profile.medications)}</Text>
            </View>

            <Text style={s.sectionTitle}>Quick Actions</Text>
            <Pressable style={[s.quickCard, s.quickCardPink]} onPress={() => setShowQrSheet((prev) => !prev)}>
              <View style={[s.sectionIcon, s.quickIconRed]}>
                <Ionicons name="qr-code-outline" size={20} color="#fff" />
              </View>
              <View style={s.quickTextWrap}>
                <Text style={s.quickTitle}>My QR Code</Text>
                <Text style={s.quickSub}>Show, copy, or regenerate your emergency QR</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#6b7280" />
            </Pressable>

            <Pressable
              style={[s.quickCard, s.quickCardBlue]}
              onPress={() => setShowIdentitySheet((prev) => !prev)}
            >
              <View style={[s.sectionIcon, s.quickIconBlue]}>
                <Ionicons name="person-outline" size={20} color="#fff" />
              </View>
              <View style={s.quickTextWrap}>
                <Text style={s.quickTitle}>Identity Details</Text>
                <Text style={s.quickSub}>Quick access to CNIC, age, and address</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#6b7280" />
            </Pressable>

            {showQrSheet && (
              <View style={s.sectionCard}>
                <View style={s.contactsHeader}>
                  <Text style={s.sectionCardTitle}>Medical QR</Text>
                  <Text style={s.viewAll} onPress={() => setShowQrSheet(false)}>Close</Text>
                </View>
                <View style={s.qrCard}>
                  {qr?.qrCodeDataUrl ? (
                    <Image source={{ uri: qr.qrCodeDataUrl }} style={s.qrImage} />
                  ) : (
                    <Text style={s.qrPlaceholder}>No QR generated yet</Text>
                  )}
                </View>
                <Text style={s.qrHint}>Scan this QR code to view emergency medical information</Text>
                <View style={s.urlCard}>
                  <Text style={s.urlLabel}>Emergency URL</Text>
                  <Text style={s.urlText}>{visibleEmergencyUrl || "No emergency URL available yet."}</Text>
                  <View style={s.urlActionRow}>
                    <Pressable style={[s.ghostBtn, s.urlActionBtn]} onPress={copyEmergencyUrl}>
                      <Ionicons name="copy-outline" size={18} color="#111827" />
                      <Text style={s.ghostBtnText}>Copy Link</Text>
                    </Pressable>
                    <Pressable style={[s.ghostBtn, s.urlActionBtn]} onPress={openEmergencyUrl}>
                      <Ionicons name="open-outline" size={18} color="#111827" />
                      <Text style={s.ghostBtnText}>Open</Text>
                    </Pressable>
                  </View>
                </View>
                <Pressable style={s.subtleBtn} onPress={regenQr}>
                  <Text style={s.subtleBtnText}>{busy ? "Working..." : "Regenerate"}</Text>
                </Pressable>
              </View>
            )}

            {showIdentitySheet && (
              <View style={s.identityCard}>
                <View style={s.contactsHeader}>
                  <Text style={s.sectionCardTitle}>Identity Details</Text>
                  <Text style={s.viewAll} onPress={() => setShowIdentitySheet(false)}>Close</Text>
                </View>
                <Text style={s.identityLine}>CNIC: {profile.cnic || user?.cnic || "Not set"}</Text>
                <Text style={s.identityLine}>Age: {profile.age || "Not set"}</Text>
                <Text style={s.identityLine}>Address: {profile.address || user?.address || "Not set"}</Text>
                <Text style={s.identityLine}>Date of Birth: {profile.dateOfBirth || user?.dateOfBirth || "Not set"}</Text>
                <Text style={s.identityLine}>Gender: {profile.gender || user?.gender || "Not set"}</Text>
              </View>
            )}

            <View style={s.contactsHeader}>
              <Text style={s.sectionTitle}>Emergency Contacts</Text>
              <Text style={s.viewAll} onPress={() => setTab("contacts")}>View All</Text>
            </View>

            <Pressable style={s.contactsPreview} onPress={() => setTab("contacts")}>
              {contacts.length === 0 ? (
                <Text style={s.previewEmpty}>
                  No emergency contacts added yet. <Text style={s.link}>Add now</Text>
                </Text>
              ) : (
                contacts.slice(0, 2).map((c) => (
                  <Text key={c.id} style={s.previewLine}>{c.name} - {c.phoneNumber}</Text>
                ))
              )}
            </Pressable>
          </>
        )}

        {tab === "profile" && (
          <>
            <View style={s.screenHead}>
              <Text style={s.screenTitle}>Medical Profile</Text>
              <Pressable onPress={saveMedical}><Text style={s.saveAction}>Save</Text></Pressable>
            </View>

            <View style={s.sectionCard}>
              <View style={s.sectionHead}>
                <View style={[s.sectionIcon, { backgroundColor: "#ef4444" }]}>
                  <MaterialCommunityIcons name="water-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={s.sectionCardTitle}>Blood Group</Text>
                  <Text style={s.sectionHint}>Critical for transfusions</Text>
                </View>
              </View>
              <View style={s.choiceWrap}>
                {BLOOD.map((group) => (
                  <Pressable
                    key={group}
                    style={[s.bloodChip, profile.bloodGroup === group && s.bloodChipOn]}
                    onPress={() => setProfile((prev) => ({ ...prev, bloodGroup: group }))}
                  >
                    <Text style={[s.bloodChipText, profile.bloodGroup === group && s.bloodChipTextOn]}>{group}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={s.sectionCard}>
              <View style={s.sectionHead}>
                <View style={[s.sectionIcon, { backgroundColor: "#f59e0b" }]}>
                  <Ionicons name="warning-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={s.sectionCardTitle}>Allergies</Text>
                  <Text style={s.sectionHint}>Food, drug, or other allergies</Text>
                </View>
              </View>
              <View style={s.inlineRow}>
                <TextInput style={s.inlineInput} placeholder="Add an allergy..." value={aDraft} onChangeText={setADraft} />
                <Pressable style={[s.inlineBtn, s.inlineBtnYellow]} onPress={() => addProfileItem("allergies", aDraft, () => setADraft(""))}>
                  <Text style={s.inlineBtnText}>Add</Text>
                </Pressable>
              </View>
              <View style={s.listWrap}>
                {profile.allergies.length === 0 ? (
                  <Text style={s.sectionHint}>No allergies added</Text>
                ) : (
                  profile.allergies.map((item, idx) => (
                    <View key={`${item}-${idx}`} style={s.itemPill}>
                      <Text style={s.itemPillText}>{item}</Text>
                      <Pressable style={s.itemPillRemove} onPress={() => removeProfileItem("allergies", item)}>
                        <Ionicons name="close" size={14} color="#b91c1c" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={s.sectionCard}>
              <View style={s.sectionHead}>
                <View style={[s.sectionIcon, { backgroundColor: "#3b82f6" }]}>
                  <Ionicons name="heart-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={s.sectionCardTitle}>Medical Conditions</Text>
                  <Text style={s.sectionHint}>Chronic illnesses or conditions</Text>
                </View>
              </View>
              <View style={s.inlineRow}>
                <TextInput style={s.inlineInput} placeholder="Add a condition..." value={cDraft} onChangeText={setCDraft} />
                <Pressable style={[s.inlineBtn, s.inlineBtnBlue]} onPress={() => addProfileItem("chronicConditions", cDraft, () => setCDraft(""))}>
                  <Text style={s.inlineBtnText}>Add</Text>
                </Pressable>
              </View>
              <View style={s.listWrap}>
                {profile.chronicConditions.length === 0 ? (
                  <Text style={s.sectionHint}>No conditions added</Text>
                ) : (
                  profile.chronicConditions.map((item, idx) => (
                    <View key={`${item}-${idx}`} style={s.itemPill}>
                      <Text style={s.itemPillText}>{item}</Text>
                      <Pressable style={s.itemPillRemove} onPress={() => removeProfileItem("chronicConditions", item)}>
                        <Ionicons name="close" size={14} color="#b91c1c" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={s.sectionCard}>
              <View style={s.sectionHead}>
                <View style={[s.sectionIcon, { backgroundColor: "#22c55e" }]}>
                  <Ionicons name="medkit-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={s.sectionCardTitle}>Current Medications</Text>
                  <Text style={s.sectionHint}>Medicines you take regularly</Text>
                </View>
              </View>
              <View style={s.inlineRow}>
                <TextInput style={s.inlineInput} placeholder="Add a medication..." value={mDraft} onChangeText={setMDraft} />
                <Pressable style={[s.inlineBtn, s.inlineBtnGreen]} onPress={() => addProfileItem("medications", mDraft, () => setMDraft(""))}>
                  <Text style={s.inlineBtnText}>Add</Text>
                </Pressable>
              </View>
              <View style={s.listWrap}>
                {profile.medications.length === 0 ? (
                  <Text style={s.sectionHint}>No medications added</Text>
                ) : (
                  profile.medications.map((item, idx) => (
                    <View key={`${item}-${idx}`} style={s.itemPill}>
                      <Text style={s.itemPillText}>{item}</Text>
                      <Pressable style={s.itemPillRemove} onPress={() => removeProfileItem("medications", item)}>
                        <Ionicons name="close" size={14} color="#b91c1c" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={s.sectionCard}>
              <Text style={s.sectionCardTitle}>Additional Details</Text>
              <Text style={s.formLabel}>CNIC</Text>
              <TextInput
                style={s.inlineInput}
                placeholder="12345-1234567-1"
                value={profile.cnic}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, "").slice(0, 13);
                  const formatted = [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)]
                    .filter(Boolean)
                    .join("-");
                  setProfile((p) => ({ ...p, cnic: formatted }));
                }}
              />
              <Text style={s.formLabel}>Age</Text>
              <TextInput
                style={s.inlineInput}
                placeholder="Enter age"
                keyboardType="number-pad"
                value={profile.age}
                onChangeText={(v) => setProfile((p) => ({ ...p, age: v.replace(/[^0-9]/g, "") }))}
              />
              <Text style={s.formLabel}>Address</Text>
              <TextInput
                style={[s.textArea, s.compactTextArea]}
                multiline
                placeholder="Enter complete address"
                value={profile.address}
                onChangeText={(v) => setProfile((p) => ({ ...p, address: v }))}
              />
              <View style={s.summaryRow}>
                <View style={s.flexOne}>
                  <Text style={s.formLabel}>Date of Birth</Text>
                  <Pressable style={[s.inlineInput, s.inlinePicker]} onPress={() => setShowProfileDobPicker(true)}>
                    <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                    <Text style={profile.dateOfBirth ? s.inlinePickerText : s.inlinePickerPlaceholder}>
                      {profile.dateOfBirth || "Select DOB"}
                    </Text>
                  </Pressable>
                </View>
                <View style={s.flexOne}>
                  <Text style={s.formLabel}>Gender</Text>
                  <View style={s.genderRow}>
                    {GENDERS.map((g) => (
                      <Pressable key={g} style={[s.genderChip, profile.gender === g && s.genderChipOn]} onPress={() => setProfile((p) => ({ ...p, gender: g }))}>
                        <Text style={[s.genderChipText, profile.gender === g && s.genderChipTextOn]}>{g}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
              {showProfileDobPicker && (
                <DateTimePicker
                  value={ymdToDate(profile.dateOfBirth)}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={onProfileDobChange}
                />
              )}
              <Text style={s.formLabel}>Emergency Notes</Text>
              <TextInput style={s.textArea} multiline value={profile.emergencyNotes} onChangeText={(v) => setProfile((p) => ({ ...p, emergencyNotes: v }))} placeholder="Add emergency notes" />
            </View>

            <View style={[s.sectionCard, s.sectionCardSoft]}>
              <Text style={s.sectionCardTitle}>Security</Text>
              <Text style={s.sectionHint}>Enable local 2-step PIN lock for app and lock-screen mode.</Text>
              {isLockEnabled ? (
                <>
                  <Text style={s.securityInfo}>2-step lock is enabled on this device.</Text>
                  <View style={s.summaryRow}>
                    <Pressable style={[s.primaryBtn, s.flexOne]} onPress={() => setIsLocked(true)}>
                      <Text style={s.primaryBtnText}>Lock Now</Text>
                    </Pressable>
                    <Pressable style={[s.subtleBtn, s.flexOne, s.compactBtn]} onPress={disableLock}>
                      <Text style={s.subtleBtnText}>Disable</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <TextInput
                    style={s.inlineInput}
                    placeholder="Set 4-digit PIN"
                    keyboardType="number-pad"
                    secureTextEntry
                    value={lockPinDraft}
                    onChangeText={(v) => setLockPinDraft(v.replace(/[^0-9]/g, "").slice(0, 4))}
                  />
                  <TextInput
                    style={s.inlineInput}
                    placeholder="Confirm PIN"
                    keyboardType="number-pad"
                    secureTextEntry
                    value={lockPinConfirm}
                    onChangeText={(v) => setLockPinConfirm(v.replace(/[^0-9]/g, "").slice(0, 4))}
                  />
                  <Pressable style={s.primaryBtn} onPress={enableLock}>
                    <Text style={s.primaryBtnText}>Enable 2-Step Lock</Text>
                  </Pressable>
                </>
              )}
              {!!lockHint && <Text style={s.sectionHint}>{lockHint}</Text>}
            </View>

            <View style={[s.sectionCard, s.sectionCardSoft]}>
              <Text style={s.sectionCardTitle}>Treatment Summary</Text>
              <Text style={s.sectionHint}>You can save more than one treatment summary entry.</Text>
              <TextInput style={s.inlineInput} placeholder="Hospital name" value={summary.hospitalName} onChangeText={(v) => setSummary((p) => ({ ...p, hospitalName: v }))} />
              <TextInput style={s.inlineInput} placeholder="Doctor name" value={summary.doctorName} onChangeText={(v) => setSummary((p) => ({ ...p, doctorName: v }))} />
              <TextInput
                style={s.inlineInput}
                placeholder="Disease starting year"
                keyboardType="number-pad"
                value={summary.diseaseStartingYear}
                onChangeText={(v) => setSummary((p) => ({ ...p, diseaseStartingYear: v.replace(/[^0-9]/g, "") }))}
              />
              <View style={s.summaryRow}>
                <TextInput style={[s.inlineInput, s.flexOne]} placeholder="Duration" value={summary.treatmentDuration} onChangeText={(v) => setSummary((p) => ({ ...p, treatmentDuration: v }))} />
                <TextInput style={[s.inlineInput, s.flexOne]} placeholder="Status" value={summary.treatmentStatus} onChangeText={(v) => setSummary((p) => ({ ...p, treatmentStatus: v }))} />
              </View>
              <View style={s.inlineRow}>
                <TextInput style={s.inlineInput} placeholder="Checkup PDF URL or name (.pdf)" value={checkupFileDraft} onChangeText={setCheckupFileDraft} />
                <Pressable style={[s.inlineBtn, s.inlineBtnGreen]} onPress={addCheckupFile}><Text style={s.inlineBtnText}>Add</Text></Pressable>
              </View>
              <Pressable style={s.subtleBtn} onPress={uploadCheckupFile}>
                <Text style={s.subtleBtnText}>Upload Checkup PDF</Text>
              </Pressable>
              <View style={s.listWrap}>
                {summary.checkupFiles.length === 0 ? (
                  <Text style={s.sectionHint}>No checkup files added</Text>
                ) : (
                  summary.checkupFiles.map((item, idx) => (
                    <View key={`${item}-${idx}`} style={s.itemPill}>
                      <Text style={s.itemPillText} numberOfLines={1}>
                        {displayCheckupFileLabel(item)}
                      </Text>
                      <Pressable style={s.itemPillAction} onPress={() => downloadCheckupFile(item)}>
                        <Ionicons name="download-outline" size={18} color="#2563eb" />
                      </Pressable>
                      <Pressable style={s.itemPillRemove} onPress={() => removeCheckupFile(item)}>
                        <Ionicons name="close" size={18} color="#b91c1c" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
              <View style={s.inlineRow}>
                <TextInput style={s.inlineInput} placeholder="Current medication" value={smDraft} onChangeText={setSmDraft} />
                <Pressable style={[s.inlineBtn, s.inlineBtnBlue]} onPress={addSummaryMedication}><Text style={s.inlineBtnText}>Add</Text></Pressable>
              </View>
              <View style={s.listWrap}>
                {summary.currentMedications.length === 0 ? (
                  <Text style={s.sectionHint}>No summary medications</Text>
                ) : (
                  summary.currentMedications.map((item, idx) => (
                    <View key={`${item}-${idx}`} style={s.itemPill}>
                      <Text style={s.itemPillText}>{item}</Text>
                      <Pressable style={s.itemPillRemove} onPress={() => removeSummaryMedication(item)}>
                        <Ionicons name="close" size={14} color="#b91c1c" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
              <TextInput style={s.textArea} multiline placeholder="Notes" value={summary.notes} onChangeText={(v) => setSummary((p) => ({ ...p, notes: v }))} />
              <View style={s.summaryRow}>
                <Pressable style={[s.primaryBtn, s.flexOne]} onPress={saveSummaryDraft}>
                  <Text style={s.primaryBtnText}>{isEditingSummaryEntry ? "Update Entry" : "Add Entry"}</Text>
                </Pressable>
                <Pressable style={[s.subtleBtn, s.flexOne, s.compactBtn]} onPress={clearSummaryDraft}>
                  <Text style={s.subtleBtnText}>Clear Form</Text>
                </Pressable>
              </View>
              <View style={s.listColumn}>
                {getActiveSummaries().length === 0 ? (
                  <Text style={s.sectionHint}>No treatment summaries added</Text>
                ) : (
                  getActiveSummaries().map((item, idx) => (
                    <View key={item.id || `${item.hospitalName}-${idx}`} style={s.savedSummaryCard}>
                      <Text style={s.savedSummaryTitle}>{item.hospitalName || `Summary ${idx + 1}`}</Text>
                      <Text style={s.savedSummaryLine}>Doctor: {item.doctorName || "Not set"}</Text>
                      <Text style={s.savedSummaryLine}>Status: {item.treatmentStatus || "Not set"}</Text>
                      <View style={s.contactActions}>
                        <Text style={s.contactAction} onPress={() => editSummaryEntry(item)}>Edit</Text>
                        <Text style={s.contactAction} onPress={() => deleteSummaryEntry(item.id)}>Delete</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </>
        )}

        {tab === "summary" && (
          <>
            <View style={s.screenHead}>
              <Text style={s.screenTitle}>Summary</Text>
            </View>
            <View style={s.sectionCard}>
              <Text style={s.sectionCardTitle}>Medical Profile Summary</Text>
              <Text style={s.publicLine}>Blood Group: {profile.bloodGroup || "Not set"}</Text>
              <Text style={s.publicLine}>CNIC: {profile.cnic || "Not set"}</Text>
              <Text style={s.publicLine}>Age: {profile.age || "Not set"}</Text>
              <Text style={s.publicLine}>Address: {profile.address || "Not set"}</Text>
              <Text style={s.publicLine}>Date of Birth: {profile.dateOfBirth || "Not set"}</Text>
              <Text style={s.publicLine}>Gender: {profile.gender || "Not set"}</Text>
              <Text style={s.publicLine}>Allergies: {joinOrFallback(profile.allergies)}</Text>
              <Text style={s.publicLine}>Conditions: {joinOrFallback(profile.chronicConditions)}</Text>
              <Text style={s.publicLine}>Medications: {joinOrFallback(profile.medications)}</Text>
              <Text style={s.publicLine}>Emergency Notes: {profile.emergencyNotes || "Not set"}</Text>
            </View>

            <View style={s.sectionCard}>
              <Text style={s.sectionCardTitle}>Treatment Summaries</Text>
              {getActiveSummaries().length === 0 ? (
                <Text style={s.publicLine}>No treatment summary added.</Text>
              ) : (
                getActiveSummaries().map((item, idx) => (
                  <View key={item.id || `${item.hospitalName}-${idx}`} style={s.summaryListBlock}>
                    <Text style={s.summaryListTitle}>{item.hospitalName || `Summary ${idx + 1}`}</Text>
                    <Text style={s.publicLine}>Doctor: {item.doctorName || "Not set"}</Text>
                    <Text style={s.publicLine}>Disease Starting Year: {item.diseaseStartingYear || "Not set"}</Text>
                    <Text style={s.publicLine}>Duration: {item.treatmentDuration || "Not set"}</Text>
                    <Text style={s.publicLine}>Status: {item.treatmentStatus || "Not set"}</Text>
                    <Text style={s.publicLine}>Checkup PDFs: {joinOrFallback(item.checkupFiles)}</Text>
                    <Text style={s.publicLine}>Current Medications: {joinOrFallback(item.currentMedications)}</Text>
                    <Text style={s.publicLine}>Notes: {item.notes || "Not set"}</Text>
                  </View>
                ))
              )}
            </View>
            <Pressable style={s.subtleBtn} onPress={() => setTab("profile")}><Text style={s.subtleBtnText}>Edit Summaries</Text></Pressable>
          </>
        )}

        {tab === "contacts" && (
          <>
            <View style={s.screenHead}><Text style={s.screenTitle}>Emergency Contacts</Text></View>
            <View style={s.contactsTip}><Text style={s.contactsTipText}>Tip: Add up to 5 emergency contacts. These will be notified when you trigger a panic alert.</Text></View>

            {showContactForm && (
              <View style={s.contactFormCard}>
                <Text style={s.sectionCardTitle}>{contactForm.id ? "Edit Contact" : "Add Contact"}</Text>
                <TextInput style={s.inlineInput} placeholder="Name" value={contactForm.name} onChangeText={(v) => setContactForm((p) => ({ ...p, name: v }))} />
                <TextInput
                  style={s.inlineInput}
                  placeholder="Contact Number"
                  value={contactForm.phoneNumber}
                  onChangeText={(v) => setContactForm((p) => ({ ...p, phoneNumber: v.replace(/[^0-9()+\-\s]/g, "") }))}
                  keyboardType="phone-pad"
                />
                <TextInput style={s.inlineInput} placeholder="Email Address" value={contactForm.email} onChangeText={(v) => setContactForm((p) => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={s.inlineInput} placeholder="Relationship" value={contactForm.relationship} onChangeText={(v) => setContactForm((p) => ({ ...p, relationship: v }))} />
                <Pressable style={[s.primaryToggle, contactForm.isPrimary && s.primaryToggleOn]} onPress={() => setContactForm((p) => ({ ...p, isPrimary: !p.isPrimary }))}>
                  <Text style={s.primaryToggleText}>{contactForm.isPrimary ? "Primary selected" : "Set as primary"}</Text>
                </Pressable>
                <View style={s.summaryRow}>
                  <Pressable style={[s.primaryBtn, s.flexOne]} onPress={saveContact}><Text style={s.primaryBtnText}>{busy ? "Saving..." : "Save Contact"}</Text></Pressable>
                  <Pressable
                    style={[s.subtleBtn, s.flexOne, s.compactBtn]}
                    onPress={() => {
                      setShowContactForm(false);
                      setContactForm({ id: "", name: "", phoneNumber: "", email: "", relationship: "", isPrimary: false });
                    }}
                  >
                    <Text style={s.subtleBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {contacts.length === 0 ? (
              <View style={s.emptyContactCard}>
                <View style={s.emptyIconWrap}><Ionicons name="call-outline" size={42} color="#6b7280" /></View>
                <Text style={s.emptyTitle}>No Contacts Yet</Text>
                <Text style={s.emptySub}>Add emergency contacts who should be notified in case of an emergency.</Text>
              </View>
            ) : (
              contacts.map((contact) => (
                <View key={contact.id} style={s.contactCard}>
                  <Text style={s.contactName}>{contact.name}</Text>
                  <Text style={s.contactPhone}>{contact.phoneNumber}</Text>
                  <Text style={s.contactPhone}>{contact.email || "No email set"}</Text>
                  <Text style={s.contactMeta}>{contact.relationship || "Relationship not set"}{contact.isPrimary ? "  |  Primary" : ""}</Text>
                  <View style={s.contactActions}>
                    <Text style={s.contactAction} onPress={() => openContactEditor(contact)}>Edit</Text>
                    <Text style={s.contactAction} onPress={() => deleteContact(contact.id)}>Delete</Text>
                  </View>
                </View>
              ))
            )}

            <Pressable style={s.primaryBtn} onPress={() => openContactEditor()}>
              <Text style={s.primaryBtnText}>+ Add Emergency Contact</Text>
            </Pressable>
          </>
        )}

      </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.bottomBar}>
        <Pressable style={s.navItem} onPress={() => setTab("home")}>
          <Ionicons name="home-outline" size={22} color={tab === "home" ? "#b91c1c" : "#6b7280"} />
          <Text style={[s.navLabel, tab === "home" && s.navLabelOn]}>Home</Text>
        </Pressable>
        <Pressable style={s.navItem} onPress={() => setTab("profile")}>
          <Ionicons name="person-outline" size={22} color={tab === "profile" ? "#b91c1c" : "#6b7280"} />
          <Text style={[s.navLabel, tab === "profile" && s.navLabelOn]}>Profile</Text>
        </Pressable>
        <View style={s.navSpacer} />
        <Pressable style={s.navItem} onPress={() => setTab("summary")}>
          <Ionicons name="document-text-outline" size={22} color={tab === "summary" ? "#b91c1c" : "#6b7280"} />
          <Text style={[s.navLabel, tab === "summary" && s.navLabelOn]}>Summary</Text>
        </Pressable>
        <Pressable style={s.navItem} onPress={() => setTab("contacts")}>
          <Ionicons name="call-outline" size={22} color={tab === "contacts" ? "#b91c1c" : "#6b7280"} />
          <Text style={[s.navLabel, tab === "contacts" && s.navLabelOn]}>Contacts</Text>
        </Pressable>
      </View>

      <Pressable style={s.sosButton} onPress={() => setShowSos(true)}>
        <Text style={s.sosText}>SOS</Text>
      </Pressable>

      {showSos && (
        <View style={s.sosOverlay}>
          <Pressable style={s.closeX} onPress={() => setShowSos(false)}>
            <Ionicons name="close" size={36} color="#fecaca" />
          </Pressable>
          <View style={s.sosIconWrap}>
            <Ionicons name="warning-outline" size={82} color="#fff" />
          </View>
          <Text style={s.sosTitle}>Emergency Alert</Text>
          <Text style={s.sosLocation}>
            Location: {lastLoc ? `${lastLoc.latitude.toFixed(4)}, ${lastLoc.longitude.toFixed(4)}` : "Will capture on send"}
          </Text>
          <View style={s.sosPanel}>
            <Text style={s.sosPanelLine}>Will alert {labelCount(contacts.length, "emergency contact")}:</Text>
            <Text style={s.sosPanelSub}>{contacts.length ? contacts.map((c) => c.name).join(", ") : "No emergency contacts set up"}</Text>
          </View>
          <TextInput style={s.sosMessageInput} multiline value={panicMsg} onChangeText={setPanicMsg} placeholder="Optional message" placeholderTextColor="#fecaca" />
          <View style={s.sosActionRow}>
            <Pressable style={s.sosCancel} onPress={() => setShowSos(false)}><Text style={s.sosCancelText}>Cancel</Text></Pressable>
            <Pressable style={s.sosSend} onPress={sendSos}><Text style={s.sosSendText}>{busy ? "Sending..." : "Send Alert"}</Text></Pressable>
          </View>
        </View>
      )}
      {isLocked && (
        <View style={s.lockOverlay}>
          <View style={s.lockCard}>
            <Ionicons name="lock-closed-outline" size={42} color="#b91c1c" />
            <Text style={s.lockTitle}>Lock Screen Enabled</Text>
            <Text style={s.lockSub}>Enter your 4-digit PIN to continue.</Text>
            <TextInput
              style={s.lockInput}
              keyboardType="number-pad"
              secureTextEntry
              value={unlockPin}
              onChangeText={(v) => setUnlockPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
              placeholder="PIN"
              placeholderTextColor="#9ca3af"
            />
            {!!lockHint && <Text style={s.fieldError}>{lockHint}</Text>}
            <Pressable style={s.primaryBtn} onPress={unlockApp}>
              <Text style={s.primaryBtnText}>Unlock</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View pointerEvents="box-none" style={s.toastWrap}>
        {toasts.map((toast) => (
          <Pressable
            key={toast.id}
            onPress={() => dismissToast(toast.id)}
            style={[
              s.toastCard,
              toast.tone === "success" && s.toastSuccess,
              toast.tone === "error" && s.toastError,
              toast.tone === "info" && s.toastInfo,
            ]}
          >
            <Text style={s.toastText}>{toast.message}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f7f7f8" },
  bootWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  bootTitle: { fontSize: 32, fontWeight: "800", color: "#111827" },
  bootSub: { color: "#6b7280" },

  logoSquare: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#e3262f",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  authWrap: { padding: 22, gap: 14, paddingBottom: 140 },
  logoBlock: { alignItems: "center", marginBottom: 8, gap: 10 },
  logoTitle: { fontSize: 52, fontWeight: "800", color: "#111827" },
  logoSub: { fontSize: 16, color: "#6b7280" },

  formWrap: { gap: 8, marginTop: 8 },
  formLabel: { color: "#111827", fontSize: 14, fontWeight: "600", marginTop: 6 },
  fieldWrap: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    backgroundColor: "#fff",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  fieldWrapMulti: { minHeight: 90, alignItems: "flex-start", paddingVertical: 12 },
  fieldInput: { flex: 1, fontSize: 17, color: "#111827" },
  fieldInputMulti: { minHeight: 58, textAlignVertical: "top" },
  datePickerText: { flex: 1, fontSize: 16, color: "#111827" },
  datePickerPlaceholder: { flex: 1, fontSize: 16, color: "#9ca3af" },

  authTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  authTitle: { fontSize: 34, fontWeight: "800", color: "#111827" },
  authSub: { color: "#6b7280", fontSize: 16 },
  rowGap: { flexDirection: "row", gap: 8 },
  flexOne: { flex: 1 },

  genderRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 1 },
  genderChip: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    backgroundColor: "#fff",
  },
  genderChipOn: { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
  genderChipText: { color: "#374151", fontSize: 12, textTransform: "capitalize" },
  genderChipTextOn: { color: "#b91c1c", fontWeight: "700" },

  primaryBtn: {
    backgroundColor: "#e3262f",
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  primaryBtnDisabled: { opacity: 0.65 },
  primaryBtnText: { color: "#fff", fontSize: 30 / 2, fontWeight: "800" },
  fieldError: { color: "#b91c1c", fontSize: 12, marginTop: 4, marginLeft: 2 },
  subtleBtn: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  subtleBtnText: { color: "#374151", fontWeight: "700" },
  centerText: { textAlign: "center", color: "#6b7280", marginTop: 10, fontSize: 18 },
  link: { color: "#b91c1c", fontWeight: "700" },
  linkSoft: { textAlign: "center", color: "#374151", textDecorationLine: "underline", marginTop: 8 },

  scannerWrap: { borderRadius: 16, overflow: "hidden" },
  scanner: { width: "100%", height: 380 },
  scannerFallback: {
    minHeight: 220,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  scannerFallbackText: { color: "#4b5563", textAlign: "center" },

  publicCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 14,
    marginTop: 10,
    gap: 5,
  },
  publicName: { fontSize: 22, fontWeight: "800", color: "#111827" },
  publicLine: { color: "#374151" },
  snapshotStamp: { color: "#6b7280", fontSize: 12, marginTop: 8 },

  apiHint: { color: "#9ca3af", textAlign: "center", fontSize: 12, marginTop: 8 },

  toastWrap: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    zIndex: 5000,
    gap: 8,
  },
  toastCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  toastText: { fontWeight: "700", fontSize: 13 },
  toastSuccess: { backgroundColor: "#dcfce7", borderColor: "#86efac" },
  toastError: { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
  toastInfo: { backgroundColor: "#e0f2fe", borderColor: "#7dd3fc" },

  page: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 140, gap: 10 },
  pageForm: { paddingBottom: 280 },
  onlineText: { color: "#0f766e", fontWeight: "700", textAlign: "center" },

  homeTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  homeActions: { flexDirection: "row", gap: 8 },
  homeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  brandMini: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMiniIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#e3262f", alignItems: "center", justifyContent: "center" },
  brandMiniTitle: { fontSize: 34 / 2, fontWeight: "800", color: "#111827" },
  homeHello: { fontSize: 48 / 2, fontWeight: "800", color: "#111827", marginTop: 6 },
  homeSub: { color: "#6b7280", fontSize: 17 },
  identityCard: {
    borderWidth: 1,
    borderColor: "#f3d7d9",
    borderRadius: 16,
    backgroundColor: "#fff7f7",
    padding: 14,
    gap: 4,
  },
  identityLine: { color: "#334155", fontSize: 13 },

  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  statCard: { width: "48.3%", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 18, backgroundColor: "#fff", padding: 14 },
  statIconBubble: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", marginBottom: 7 },
  statValue: { fontSize: 31 / 2, fontWeight: "800", color: "#111827" },
  statLabel: { color: "#6b7280" },

  sectionTitle: { fontSize: 40 / 2, fontWeight: "800", color: "#111827", marginTop: 12 },
  quickCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quickCardPink: { backgroundColor: "#fff7f7", borderColor: "#f3d7d9" },
  quickCardBlue: { backgroundColor: "#f0f7ff", borderColor: "#cde3fb" },
  quickIconRed: { backgroundColor: "#e3262f" },
  quickIconBlue: { backgroundColor: "#3b82f6" },
  quickTextWrap: { flex: 1 },
  quickTitle: { fontSize: 34 / 2, fontWeight: "800", color: "#111827" },
  quickSub: { color: "#6b7280" },

  contactsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  viewAll: { color: "#b91c1c", fontWeight: "700", marginTop: 10 },
  contactsPreview: { borderRadius: 18, borderWidth: 1, borderColor: "#dbeafe", backgroundColor: "#eff6ff", padding: 16, minHeight: 95 },
  previewEmpty: { color: "#6b7280", fontSize: 18 / 1.2 },
  previewLine: { color: "#1f2937", marginBottom: 4 },

  screenHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  screenTitle: { fontSize: 45 / 2, fontWeight: "800", color: "#111827" },
  saveAction: { color: "#b91c1c", fontWeight: "800", fontSize: 18 },

  sectionCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 18, backgroundColor: "#fff", padding: 14, gap: 8, marginTop: 6 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sectionCardTitle: { fontSize: 34 / 2, fontWeight: "800", color: "#111827" },
  sectionHint: { color: "#6b7280", fontSize: 13 },

  choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bloodChip: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: "#fff" },
  bloodChipOn: { borderColor: "#fca5a5", backgroundColor: "#fee2e2" },
  bloodChipText: { color: "#374151", fontWeight: "700" },
  bloodChipTextOn: { color: "#b91c1c" },

  inlineRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    minHeight: 44,
    paddingHorizontal: 12,
    color: "#111827",
  },
  inlinePicker: { flexDirection: "row", alignItems: "center", gap: 8 },
  inlinePickerText: { color: "#111827", fontSize: 14 },
  inlinePickerPlaceholder: { color: "#9ca3af", fontSize: 14 },
  inlineBtn: { borderRadius: 12, minHeight: 44, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  inlineBtnYellow: { backgroundColor: "#f59e0b" },
  inlineBtnBlue: { backgroundColor: "#3b82f6" },
  inlineBtnGreen: { backgroundColor: "#22c55e" },
  inlineBtnText: { color: "#fff", fontWeight: "700" },
  compactBtn: { marginTop: 12 },

  listWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  itemPill: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
  },
  itemPillText: { color: "#334155", fontSize: 13, flexShrink: 1, maxWidth: 180 },
  itemPillRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
  },
  itemPillAction: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbeafe",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    minHeight: 88,
    textAlignVertical: "top",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
  },
  compactTextArea: { minHeight: 62 },
  sectionCardSoft: { backgroundColor: "#fafafa" },
  summaryRow: { flexDirection: "row", gap: 8 },
  listColumn: { gap: 8 },
  savedSummaryCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, backgroundColor: "#fff", padding: 12, gap: 4 },
  savedSummaryTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  savedSummaryLine: { color: "#475569", fontSize: 13 },
  securityInfo: { color: "#334155", fontSize: 14 },

  qrTop: { alignItems: "center" },
  qrAvatar: { width: 116, height: 116, borderRadius: 58, backgroundColor: "#ffe4e6", alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: 18 },
  qrAvatarText: { color: "#be123c", fontSize: 46 / 2, fontWeight: "800" },
  qrName: { fontSize: 58 / 2, fontWeight: "800", textAlign: "center", marginTop: 10, color: "#111827" },
  qrSub: { textAlign: "center", color: "#6b7280", fontSize: 18, marginBottom: 6 },
  qrCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, backgroundColor: "#fff", padding: 16, alignItems: "center", justifyContent: "center", minHeight: 320 },
  qrImage: { width: 290, height: 290 },
  qrPlaceholder: { color: "#6b7280" },
  qrHint: { textAlign: "center", color: "#6b7280", fontSize: 30 / 2, marginTop: 10 },
  urlCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, backgroundColor: "#fff", padding: 12, marginTop: 10, gap: 6 },
  urlLabel: { color: "#374151", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  urlText: { color: "#111827", fontSize: 13 },
  urlActionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  urlActionBtn: { flex: 1 },
  qrActionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  ghostBtn: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, minHeight: 44, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, backgroundColor: "#fff" },
  ghostBtnText: { color: "#111827", fontWeight: "700" },
  summaryListBlock: { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 10, marginTop: 4, gap: 2 },
  summaryListTitle: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 2 },

  contactsTip: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 20, padding: 16, backgroundColor: "#f1f5f9", marginTop: 6 },
  contactsTipText: { color: "#334155", fontSize: 18 / 1.2 },
  emptyContactCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 22, backgroundColor: "#fff", minHeight: 280, padding: 22, alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 38 / 2, fontWeight: "800", color: "#111827" },
  emptySub: { textAlign: "center", color: "#6b7280", fontSize: 16 },

  contactCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, backgroundColor: "#fff", padding: 14, gap: 2 },
  contactName: { fontSize: 18, fontWeight: "800", color: "#111827" },
  contactPhone: { color: "#334155" },
  contactMeta: { color: "#6b7280", fontSize: 12 },
  contactActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  contactAction: { color: "#b91c1c", fontWeight: "700" },
  contactFormCard: { borderWidth: 1, borderColor: "#fecaca", borderRadius: 16, backgroundColor: "#fff7f7", padding: 14, gap: 8, marginTop: 8 },
  primaryToggle: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  primaryToggleOn: { borderColor: "#fca5a5", backgroundColor: "#fee2e2" },
  primaryToggleText: { color: "#7f1d1d", fontWeight: "700" },

  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, height: 90, borderTopWidth: 1, borderTopColor: "#e5e7eb", backgroundColor: "#fff", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 10 },
  navItem: { width: 68, alignItems: "center", gap: 2 },
  navLabel: { color: "#6b7280", fontSize: 12 },
  navLabelOn: { color: "#b91c1c", fontWeight: "700" },
  navSpacer: { width: 84 },

  sosButton: {
    position: "absolute",
    bottom: 36,
    alignSelf: "center",
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 5,
    borderColor: "#fecdd3",
    backgroundColor: "#e3262f",
    alignItems: "center",
    justifyContent: "center",
  },
  sosText: { color: "#fff", fontSize: 34 / 2, fontWeight: "900" },

  sosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#e3262f",
    paddingHorizontal: 24,
    paddingTop: 68,
    gap: 14,
  },
  closeX: { position: "absolute", right: 20, top: 42 },
  sosIconWrap: { alignItems: "center", marginTop: 56 },
  sosTitle: { textAlign: "center", color: "#fff", fontSize: 60 / 2, fontWeight: "800" },
  sosLocation: { textAlign: "center", color: "#fee2e2", fontSize: 20 / 1.2 },
  sosPanel: { borderRadius: 20, backgroundColor: "#ef444455", padding: 18, gap: 6 },
  sosPanelLine: { color: "#fff", fontSize: 18 },
  sosPanelSub: { color: "#fecaca", fontSize: 20 / 1.2 },
  sosMessageInput: { borderWidth: 1, borderColor: "#fca5a5", borderRadius: 12, minHeight: 76, textAlignVertical: "top", paddingHorizontal: 12, paddingVertical: 10, color: "#fff" },
  sosActionRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  sosCancel: { flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: "#ffffff44", alignItems: "center", justifyContent: "center" },
  sosSend: { flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  sosCancelText: { color: "#fff", fontSize: 19, fontWeight: "700" },
  sosSendText: { color: "#b91c1c", fontSize: 19, fontWeight: "800" },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    zIndex: 7000,
  },
  lockCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 18,
    gap: 10,
    alignItems: "center",
  },
  lockTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  lockSub: { color: "#6b7280", textAlign: "center" },
  lockInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    color: "#111827",
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 4,
  },
});
