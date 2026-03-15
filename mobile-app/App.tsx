import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

type TabKey = "profile" | "summary" | "contacts" | "qrpanic";

type Contact = {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  isPrimary?: boolean;
};

const defaultBaseUrl = "https://5bb8-39-34-173-21.ngrok-free.app/v2";
const HARDCODED_ACCESS_TOKEN = "";
const HARDCODED_USER_NAME = "Admin";

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const joinCsv = (values?: string[]) => (values || []).join(", ");

async function api<T>(
  baseUrl: string,
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  token?: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = (payload as { message?: string | string[] } | null)?.message;
    if (Array.isArray(message)) throw new Error(message.join(", "));
    if (typeof message === "string" && message.trim()) throw new Error(message);
    throw new Error(`${method} ${path} failed (${response.status})`);
  }

  return payload as T;
}

export default function App() {
  const baseUrl = defaultBaseUrl;
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("Pakistan1");
  const [token, setToken] = useState(HARDCODED_ACCESS_TOKEN);
  const [userName, setUserName] = useState(
    HARDCODED_ACCESS_TOKEN ? HARDCODED_USER_NAME : "",
  );
  const [tab, setTab] = useState<TabKey>("profile");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const [profile, setProfile] = useState({
    bloodGroup: "",
    allergies: "",
    chronicConditions: "",
    medications: "",
    pastSurgeries: "",
    emergencyNotes: "",
    dateOfBirth: "",
    gender: "",
  });
  const [summary, setSummary] = useState({
    hospitalName: "",
    doctorName: "",
    treatmentDuration: "",
    treatmentStatus: "",
    currentMedications: "",
    notes: "",
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactForm, setContactForm] = useState({
    id: "",
    name: "",
    phoneNumber: "",
    relationship: "",
    isPrimary: false,
  });
  const [qr, setQr] = useState<{
    token?: string;
    emergencyUrl?: string;
    qrCodeDataUrl?: string;
  } | null>(null);
  const [panic, setPanic] = useState({
    latitude: "",
    longitude: "",
    message: "",
    result: "",
  });

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setStatus("");
    try {
      await fn();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const login = () =>
    run(async () => {
      const res = await api<{
        accessToken: string;
        user: { fullName: string };
        message: string;
      }>(baseUrl, "/auth/login", "POST", undefined, { email, password });
      setToken(res.accessToken);
      setUserName(res.user.fullName);
      setStatus(res.message || "Logged in");
    });

  const logout = () => {
    setToken("");
    setUserName("");
    setStatus("Logged out");
  };

  const loadProfile = () =>
    run(async () => {
      const res = await api<any>(baseUrl, "/me/medical-profile", "GET", token);
      if (!res) return setStatus("No profile found yet.");
      setProfile({
        bloodGroup: res.bloodGroup || "",
        allergies: joinCsv(res.allergies),
        chronicConditions: joinCsv(res.chronicConditions),
        medications: joinCsv(res.medications),
        pastSurgeries: joinCsv(res.pastSurgeries),
        emergencyNotes: res.emergencyNotes || "",
        dateOfBirth: res.dateOfBirth ? String(res.dateOfBirth).slice(0, 10) : "",
        gender: res.gender || "",
      });
      setStatus("Medical profile loaded.");
    });

  const saveProfile = () =>
    run(async () => {
      const payload: Record<string, unknown> = {
        allergies: splitCsv(profile.allergies),
        chronicConditions: splitCsv(profile.chronicConditions),
        medications: splitCsv(profile.medications),
        pastSurgeries: splitCsv(profile.pastSurgeries),
      };
      if (profile.bloodGroup.trim()) payload.bloodGroup = profile.bloodGroup.trim();
      if (profile.emergencyNotes.trim()) payload.emergencyNotes = profile.emergencyNotes.trim();
      if (profile.dateOfBirth.trim()) payload.dateOfBirth = profile.dateOfBirth.trim();
      if (profile.gender.trim()) payload.gender = profile.gender.trim();
      await api(baseUrl, "/me/medical-profile", "PUT", token, payload);
      setStatus("Medical profile saved.");
    });

  const loadSummary = () =>
    run(async () => {
      const res = await api<any>(baseUrl, "/me/medical-summary", "GET", token);
      if (!res) return setStatus("No summary found yet.");
      setSummary({
        hospitalName: res.hospitalName || "",
        doctorName: res.doctorName || "",
        treatmentDuration: res.treatmentDuration || "",
        treatmentStatus: res.treatmentStatus || "",
        currentMedications: joinCsv(res.currentMedications),
        notes: res.notes || "",
      });
      setStatus("Medical summary loaded.");
    });

  const saveSummary = () =>
    run(async () => {
      const payload: Record<string, unknown> = {
        currentMedications: splitCsv(summary.currentMedications),
      };
      if (summary.hospitalName.trim()) payload.hospitalName = summary.hospitalName.trim();
      if (summary.doctorName.trim()) payload.doctorName = summary.doctorName.trim();
      if (summary.treatmentDuration.trim()) payload.treatmentDuration = summary.treatmentDuration.trim();
      if (summary.treatmentStatus.trim()) payload.treatmentStatus = summary.treatmentStatus.trim();
      if (summary.notes.trim()) payload.notes = summary.notes.trim();
      await api(baseUrl, "/me/medical-summary", "PUT", token, payload);
      setStatus("Medical summary saved.");
    });

  const refreshContacts = () =>
    run(async () => {
      const res = await api<Contact[]>(baseUrl, "/me/emergency-contacts", "GET", token);
      setContacts(res || []);
      setStatus("Contacts loaded.");
    });

  const saveContact = () =>
    run(async () => {
      if (!contactForm.name.trim() || !contactForm.phoneNumber.trim()) {
        throw new Error("Name and phone number are required.");
      }
      const payload: Record<string, unknown> = {
        name: contactForm.name.trim(),
        phoneNumber: contactForm.phoneNumber.trim(),
        isPrimary: contactForm.isPrimary,
      };
      if (contactForm.relationship.trim()) payload.relationship = contactForm.relationship.trim();
      if (contactForm.id) {
        await api(baseUrl, `/me/emergency-contacts/${contactForm.id}`, "PUT", token, payload);
      } else {
        await api(baseUrl, "/me/emergency-contacts", "POST", token, payload);
      }
      setContactForm({ id: "", name: "", phoneNumber: "", relationship: "", isPrimary: false });
      await refreshContacts();
    });

  const removeContact = (id: string) =>
    run(async () => {
      await api(baseUrl, `/me/emergency-contacts/${id}`, "DELETE", token);
      await refreshContacts();
    });

  const loadQr = () =>
    run(async () => {
      const res = await api<any>(baseUrl, "/me/qr", "GET", token);
      setQr(res);
      setStatus(res?.message || "QR loaded.");
    });

  const regenQr = () =>
    run(async () => {
      const res = await api<any>(baseUrl, "/me/qr/regenerate", "POST", token);
      setQr(res);
      setStatus("QR regenerated.");
    });

  const sendPanic = () =>
    run(async () => {
      const latitude = Number(panic.latitude);
      const longitude = Number(panic.longitude);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw new Error("Latitude/Longitude must be numbers.");
      }
      const res = await api<any>(baseUrl, "/me/panic-alerts", "POST", token, {
        latitude,
        longitude,
        ...(panic.message.trim() ? { message: panic.message.trim() } : {}),
      });
      setPanic((prev) => ({
        ...prev,
        result: `Status: ${res?.data?.status || "N/A"}${res?.warning ? ` | ${res.warning}` : ""}`,
      }));
      setStatus("Panic alert submitted.");
    });

  if (!token) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.heading}>RESQID Mobile</Text>
          <Text style={styles.apiText}>API: {baseUrl}</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="Email" />
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
          <Pressable style={styles.primaryBtn} onPress={login}><Text style={styles.primaryBtnText}>{busy ? "Please wait..." : "Login"}</Text></Pressable>
          {!!status && <Text style={styles.status}>{status}</Text>}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.row}><Text style={styles.heading}>Hi, {userName}</Text><Pressable style={styles.secondaryBtn} onPress={logout}><Text>Logout</Text></Pressable></View>
        <Text style={styles.apiText}>API: {baseUrl}</Text>
        <View style={styles.tabs}>{(["profile", "summary", "contacts", "qrpanic"] as TabKey[]).map((k) => <Pressable key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}><Text style={tab === k ? styles.tabTextActive : styles.tabText}>{k.toUpperCase()}</Text></Pressable>)}</View>

        {tab === "profile" && <View style={styles.card}><View style={styles.row}><Pressable style={styles.secondaryBtn} onPress={loadProfile}><Text>Load</Text></Pressable><Pressable style={styles.primaryBtnSm} onPress={saveProfile}><Text style={styles.primaryBtnText}>Save</Text></Pressable></View><TextInput style={styles.input} value={profile.bloodGroup} onChangeText={(v) => setProfile((p) => ({ ...p, bloodGroup: v }))} placeholder="Blood Group" /><TextInput style={styles.input} value={profile.allergies} onChangeText={(v) => setProfile((p) => ({ ...p, allergies: v }))} placeholder="Allergies (csv)" /><TextInput style={styles.input} value={profile.chronicConditions} onChangeText={(v) => setProfile((p) => ({ ...p, chronicConditions: v }))} placeholder="Chronic conditions (csv)" /><TextInput style={styles.input} value={profile.medications} onChangeText={(v) => setProfile((p) => ({ ...p, medications: v }))} placeholder="Medications (csv)" /><TextInput style={styles.input} value={profile.pastSurgeries} onChangeText={(v) => setProfile((p) => ({ ...p, pastSurgeries: v }))} placeholder="Past surgeries (csv)" /><TextInput style={styles.input} value={profile.dateOfBirth} onChangeText={(v) => setProfile((p) => ({ ...p, dateOfBirth: v }))} placeholder="DOB YYYY-MM-DD" /><TextInput style={styles.input} value={profile.gender} onChangeText={(v) => setProfile((p) => ({ ...p, gender: v }))} placeholder="Gender" /><TextInput style={[styles.input, styles.multi]} value={profile.emergencyNotes} onChangeText={(v) => setProfile((p) => ({ ...p, emergencyNotes: v }))} placeholder="Emergency notes" multiline /></View>}

        {tab === "summary" && <View style={styles.card}><View style={styles.row}><Pressable style={styles.secondaryBtn} onPress={loadSummary}><Text>Load</Text></Pressable><Pressable style={styles.primaryBtnSm} onPress={saveSummary}><Text style={styles.primaryBtnText}>Save</Text></Pressable></View><TextInput style={styles.input} value={summary.hospitalName} onChangeText={(v) => setSummary((p) => ({ ...p, hospitalName: v }))} placeholder="Hospital" /><TextInput style={styles.input} value={summary.doctorName} onChangeText={(v) => setSummary((p) => ({ ...p, doctorName: v }))} placeholder="Doctor" /><TextInput style={styles.input} value={summary.treatmentDuration} onChangeText={(v) => setSummary((p) => ({ ...p, treatmentDuration: v }))} placeholder="Treatment duration" /><TextInput style={styles.input} value={summary.treatmentStatus} onChangeText={(v) => setSummary((p) => ({ ...p, treatmentStatus: v }))} placeholder="Treatment status" /><TextInput style={styles.input} value={summary.currentMedications} onChangeText={(v) => setSummary((p) => ({ ...p, currentMedications: v }))} placeholder="Current medications (csv)" /><TextInput style={[styles.input, styles.multi]} value={summary.notes} onChangeText={(v) => setSummary((p) => ({ ...p, notes: v }))} placeholder="Notes" multiline /></View>}

        {tab === "contacts" && <View style={styles.card}><View style={styles.row}><Pressable style={styles.secondaryBtn} onPress={refreshContacts}><Text>Refresh</Text></Pressable><Pressable style={styles.secondaryBtn} onPress={() => setContactForm({ id: "", name: "", phoneNumber: "", relationship: "", isPrimary: false })}><Text>New</Text></Pressable></View>{contacts.map((c) => <View key={c.id} style={styles.contact}><Text>{c.name} - {c.phoneNumber}</Text><Text>{c.relationship || "N/A"} | {c.isPrimary ? "Primary" : "Secondary"}</Text><View style={styles.row}><Pressable style={styles.secondaryBtn} onPress={() => setContactForm({ id: c.id, name: c.name, phoneNumber: c.phoneNumber, relationship: c.relationship || "", isPrimary: !!c.isPrimary })}><Text>Edit</Text></Pressable><Pressable style={styles.dangerBtn} onPress={() => removeContact(c.id)}><Text style={styles.primaryBtnText}>Delete</Text></Pressable></View></View>)}<TextInput style={styles.input} value={contactForm.name} onChangeText={(v) => setContactForm((p) => ({ ...p, name: v }))} placeholder="Contact name" /><TextInput style={styles.input} value={contactForm.phoneNumber} onChangeText={(v) => setContactForm((p) => ({ ...p, phoneNumber: v }))} placeholder="Phone number" /><TextInput style={styles.input} value={contactForm.relationship} onChangeText={(v) => setContactForm((p) => ({ ...p, relationship: v }))} placeholder="Relationship" /><View style={styles.row}><Text>Primary Contact</Text><Switch value={contactForm.isPrimary} onValueChange={(v) => setContactForm((p) => ({ ...p, isPrimary: v }))} /></View><Pressable style={styles.primaryBtnSm} onPress={saveContact}><Text style={styles.primaryBtnText}>{contactForm.id ? "Update Contact" : "Save Contact"}</Text></Pressable></View>}

        {tab === "qrpanic" && <View style={styles.card}><View style={styles.row}><Pressable style={styles.secondaryBtn} onPress={loadQr}><Text>Load QR</Text></Pressable><Pressable style={styles.primaryBtnSm} onPress={regenQr}><Text style={styles.primaryBtnText}>Regenerate</Text></Pressable></View>{qr?.qrCodeDataUrl ? <Image source={{ uri: qr.qrCodeDataUrl }} style={styles.qr} /> : null}{qr?.token ? <Text>Token: {qr.token}</Text> : null}{qr?.emergencyUrl ? <Text>URL: {qr.emergencyUrl}</Text> : null}<TextInput style={styles.input} value={panic.latitude} onChangeText={(v) => setPanic((p) => ({ ...p, latitude: v }))} placeholder="Latitude" keyboardType="numeric" /><TextInput style={styles.input} value={panic.longitude} onChangeText={(v) => setPanic((p) => ({ ...p, longitude: v }))} placeholder="Longitude" keyboardType="numeric" /><TextInput style={[styles.input, styles.multi]} value={panic.message} onChangeText={(v) => setPanic((p) => ({ ...p, message: v }))} placeholder="Optional message" multiline /><Pressable style={styles.dangerBtnWide} onPress={sendPanic}><Text style={styles.primaryBtnText}>Send Panic Alert</Text></Pressable>{panic.result ? <Text>{panic.result}</Text> : null}</View>}

        {!!status && <Text style={styles.status}>{status}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6fa" },
  page: { padding: 16, gap: 10 },
  heading: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" },
  multi: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 8, justifyContent: "space-between", alignItems: "center" },
  tabs: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tab: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#fff" },
  tabActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  tabText: { color: "#334155", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#fff", fontSize: 12, fontWeight: "700" },
  card: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, backgroundColor: "#fff", padding: 10, gap: 8 },
  primaryBtn: { borderRadius: 8, backgroundColor: "#16a34a", alignItems: "center", paddingVertical: 12 },
  primaryBtnSm: { borderRadius: 8, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { borderWidth: 1, borderColor: "#94a3b8", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" },
  dangerBtn: { borderRadius: 8, backgroundColor: "#dc2626", paddingHorizontal: 12, paddingVertical: 10 },
  dangerBtnWide: { borderRadius: 8, backgroundColor: "#dc2626", alignItems: "center", paddingVertical: 12 },
  contact: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 10, gap: 6 },
  qr: { width: 220, height: 220, alignSelf: "center", borderRadius: 8 },
  status: { color: "#0f766e", fontWeight: "600" },
  apiText: { color: "#475569", fontSize: 12, marginBottom: 6 },
});
