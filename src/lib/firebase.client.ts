'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,          // must exist at build
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebase() {
  if (typeof window === 'undefined') return { app: undefined, auth: undefined, db: undefined }; // SSR: do nothing

  app = getApps().length ? getApp() : initializeApp(config);

  // Firestore: initialize once (no stray `{ {` braces!)
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache(), // optional, but safe for web
  });

  auth = getAuth(app);
  return { app, auth, db };
}
