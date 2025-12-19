import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Read configuration from env
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const isProd = import.meta.env.MODE === 'production';
const usedFallback = Object.values(envConfig).some((v) => !v);

if (usedFallback) {
  const missing = Object.entries(envConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (isProd) {
    throw new Error(`Missing Firebase env variables: ${missing.join(', ')}`);
  } else {
    console.warn(
      `[Firebase] Missing env vars: ${missing.join(', ')}. Using demo credentials for local development. ` +
        `Set VITE_FIREBASE_* in your .env.local for production.`,
    );
  }
}

// Demo fallback values for local dev convenience
const fallbackConfig = {
  apiKey: 'AIzaSyB7LrGyDeLg41PGhDVB_mQdwHeJbHT5V5A',
  authDomain: 'random-b5065.firebaseapp.com',
  databaseURL: 'https://random-b5065-default-rtdb.firebaseio.com',
  projectId: 'random-b5065',
  storageBucket: 'random-b5065.firebasestorage.app',
  messagingSenderId: '253398505008',
  appId: '1:253398505008:web:c2844a317d5ebb7c43bff5',
  measurementId: 'G-2S8FQFJKLG',
};

const firebaseConfig = isProd
  ? (envConfig as any)
  : {
      apiKey: envConfig.apiKey ?? fallbackConfig.apiKey,
      authDomain: envConfig.authDomain ?? fallbackConfig.authDomain,
      databaseURL: envConfig.databaseURL ?? fallbackConfig.databaseURL,
      projectId: envConfig.projectId ?? fallbackConfig.projectId,
      storageBucket: envConfig.storageBucket ?? fallbackConfig.storageBucket,
      messagingSenderId: envConfig.messagingSenderId ?? fallbackConfig.messagingSenderId,
      appId: envConfig.appId ?? fallbackConfig.appId,
      measurementId: envConfig.measurementId ?? fallbackConfig.measurementId,
    };

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig, usedFallback };
