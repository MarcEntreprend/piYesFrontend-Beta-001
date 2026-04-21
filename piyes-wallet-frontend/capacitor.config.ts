// capacitor.config.ts

import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ht.piyes.app",
  appName: "piYès",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: true,
    allowNavigation: ["*"],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
