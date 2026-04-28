import { registerRootComponent } from "expo";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "react-native-notify-kit";
import App from "./App";

const SOS_CHANNEL_ID = "sos_channel_lock_v2";

async function ensureSosChannel(): Promise<void> {
  await notifee.createChannel({
    id: SOS_CHANNEL_ID,
    name: "SOS Emergency",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    lights: true,
  });
}

void ensureSosChannel();

registerRootComponent(App);
