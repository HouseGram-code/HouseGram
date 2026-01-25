
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCGTBZzJiIKs7zZY0g1ndT5xbWNwOwCrl8",
  authDomain: "housegram-50b40.firebaseapp.com",
  projectId: "housegram-50b40",
  storageBucket: "housegram-50b40.firebasestorage.app",
  messagingSenderId: "524582399076",
  appId: "1:524582399076:web:5e15d993f0087eefd14371"
  // measurementId removed to prevent Analytics warning
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics disabled
export const analytics = null;
