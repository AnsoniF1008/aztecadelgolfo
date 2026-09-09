import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
const EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true'

export const app = initializeApp(config)
export const auth = getAuth(app)
export const db = getFirestore(app)

if (EMULATORS) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

// Storage and Functions are only needed when someone uploads a file or claims the
// first admin role, so they load on demand instead of riding along on every page.
let _storage = null
export async function getStorageLazy() {
  if (_storage) return _storage
  const { getStorage, connectStorageEmulator } = await import('firebase/storage')
  _storage = getStorage(app)
  if (EMULATORS) connectStorageEmulator(_storage, '127.0.0.1', 9199)
  return _storage
}

let _functions = null
export async function getFunctionsLazy() {
  if (_functions) return _functions
  const { getFunctions, connectFunctionsEmulator } = await import('firebase/functions')
  _functions = getFunctions(app)
  if (EMULATORS) connectFunctionsEmulator(_functions, '127.0.0.1', 5001)
  return _functions
}
