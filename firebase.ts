
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCGTBZzJiIKs7zZY0g1ndT5xbWNwOwCrl8",
  authDomain: "housegram-50b40.firebaseapp.com",
  projectId: "housegram-50b40",
  storageBucket: "housegram-50b40.firebasestorage.app",
  messagingSenderId: "524582399076",
  appId: "1:524582399076:web:5e15d993f0087eefd14371"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app);

// Analytics disabled
export const analytics = null;
