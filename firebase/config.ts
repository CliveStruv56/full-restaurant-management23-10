import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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

// Get Firestore, Auth, and Storage instances
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };