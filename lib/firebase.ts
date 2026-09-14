import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

export function getFirebaseApp(name = "[DEFAULT]") {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (Object.values(config).some((value) => !value)) return null;
  const existing = getApps().find((app) => app.name === name);
  if (existing) return existing;
  const app = initializeApp(
    { ...config, databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL },
    name,
  );
  if (
    config.projectId?.startsWith("demo-") &&
    process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "1"
  ) {
    connectAuthEmulator(getAuth(app), "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(getFirestore(app), "127.0.0.1", 8080);
    if (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL)
      connectDatabaseEmulator(getDatabase(app), "127.0.0.1", 9000);
  }
  return app;
}

export function getFirebase() {
  if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  return { auth: getAuth(app), database: getDatabase(app) };
}
