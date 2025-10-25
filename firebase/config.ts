import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// --- IMPORTANT ---
// 1. Go to your Firebase project console.
// 2. Go to Project Settings > General tab.
// 3. Under "Your apps", find your web app and the "Firebase SDK snippet".
// 4. Choose the "Config" option.
// 5. Copy the entire `firebaseConfig` object and paste it here, replacing the placeholder.

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALe8znJtnhiRUe6CrPAMRWq04lS2gGduY",
  authDomain: "coffee-shop-mvp-4ff60.firebaseapp.com",
  projectId: "coffee-shop-mvp-4ff60",
  storageBucket: "coffee-shop-mvp-4ff60.firebasestorage.app",
  messagingSenderId: "801630582937",
  appId: "1:801630582937:web:91aff3c65f23abd4c26008"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore, Auth, Storage, and Functions instances
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db, {
  synchronizeTabs: true
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('⚠️ Offline persistence failed: Multiple tabs open. Only one tab can enable persistence.');
  } else if (err.code === 'unimplemented') {
    console.warn('⚠️ Offline persistence not supported in this browser.');
  } else {
    console.error('❌ Error enabling offline persistence:', err);
  }
});

console.log('✅ Firebase initialized with offline persistence');

export { db, auth, storage, functions };