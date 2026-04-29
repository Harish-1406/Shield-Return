import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "demo-project",
  // Other config doesn't matter for local emulator
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to local emulator
connectFirestoreEmulator(db, '127.0.0.1', 8080);

export { db };
