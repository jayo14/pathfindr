import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "PathFindr",
  slug: "pathfindr",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: ["rork-app", "pathfindr"],
  userInterfaceStyle: "automatic",
  newArchEnabled: false,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "app.rork.n9ouzx13yea3awmll9tjk",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "app.rork.n9ouzx13yea3awmll9tjk",
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
    ],
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      },
    },
  },
  web: {
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    ["expo-router", { origin: "https://rork.com/" }],
    "expo-font",
    "expo-web-browser",
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#0D8C60",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "PathFindr needs your location to show you on the campus map and calculate walking routes.",
        locationWhenInUsePermission:
          "PathFindr needs your location to show you on the campus map and calculate walking routes.",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "PathFindr needs camera access to scan QR codes on campus signage and open building information instantly.",
      },
    ],
    "expo-secure-store",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: "https://rork.com/",
    },
    eas: {
      projectId: "e654bc2d-aa98-4405-996a-8392bb473b0c",
    },
  },
  owner: "codegallantx",
};

export default config;
