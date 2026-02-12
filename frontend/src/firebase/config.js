import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate that required env vars are present
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missing = requiredKeys.filter((k) => !firebaseConfig[k]);
if (missing.length > 0) {
  console.error(
    `[Firebase] Missing required config: ${missing.join(', ')}. ` +
    'Create a .env.local file with VITE_FIREBASE_* variables. See .env.example for reference.',
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Quick connectivity check — tries to read 1 doc from the 'properties' collection.
 * Resolves to { ok: true } or { ok: false, error: string }.
 */
export async function testFirestoreConnection() {
  try {
    await getDocs(query(collection(db, 'properties'), limit(1)));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.code || err.message };
  }
}

export default app;
