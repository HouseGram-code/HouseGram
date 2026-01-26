
import React, { useState, useEffect } from 'react';
import { AppScreen, Chat, User, StorageStats } from './types.ts';
import AuthScreen from './components/AuthScreen.tsx';
import ChatList from './components/ChatList.tsx';
import ChatScreen from './components/ChatScreen.tsx';
import Sidebar from './components/Sidebar.tsx';
import ProfileScreen from './components/ProfileScreen.tsx';
import UserInfoScreen from './components/UserInfoScreen.tsx';
import FeaturesScreen from './components/FeaturesScreen.tsx';
import PrivacyScreen from './components/PrivacyScreen.tsx';
import FAQScreen from './components/FAQScreen.tsx';
import NotificationScreen from './components/NotificationScreen.tsx';
import GuideScreen from './components/GuideScreen.tsx';
import DataStorageScreen from './components/DataStorageScreen.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import SnowEffect from './components/SnowEffect.tsx';
import { LanguageProvider } from './LanguageContext.tsx';
import { auth, db } from './firebase.ts';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, onSnapshot } from "firebase/firestore";

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<AppScreen>(AppScreen.AUTH);
  const [isLoading, setIsLoading] = useState(true);
  const [snowEnabled, setSnowEnabled] = useState(false);

  // --- Real Persistent Storage Stats ---
  const [storageStats, setStorageStats] = useState<StorageStats>(() => {
    const saved = localStorage.getItem('hg_storage_stats');
    if (saved) return JSON.parse(saved);
    return {
      media: 0,
      files: 0,
      voice: 0,
      total: 0
    };
  });

  // Listen for Global Snow Setting
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'settings'), (doc) => {
        if (doc.exists()) {
            setSnowEnabled(doc.data()?.snowEnabled || false);
        }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('hg_storage_stats', JSON.stringify(storageStats));
  }, [storageStats]);

  const handleFileUpload = (size: number, category: 'media' | 'files' | 'voice') => {
    setStorageStats(prev => ({
      ...prev,
      [category]: prev[category] + size,
      total: prev.total + size
    }));
  };

  // --- Powerful Presence Logic (Heartbeat) ---
  useEffect(() => {
    if (!currentUser?.id) return;

    const userStatusRef = doc(db, "users", currentUser.id);

    // Function to send heartbeat
    const sendHeartbeat = async () => {
      if (document.visibilityState === 'visible') {
        try {
          await updateDoc(userStatusRef, { 
            status: 'online', 
            lastSeen: Date.now() // Use Server Timestamp ideally, but client Date.now() works for this scope
          });
        } catch (e) {
          // Silent fail on heartbeat offline
        }
      }
    };

    const setOffline = async () => {
       try {
        await updateDoc(userStatusRef, { 
            status: 'offline', 
            lastSeen: Date.now() 
        });
       } catch (e) {}
    };

    // 1. Initial Heartbeat
    sendHeartbeat();

    // 2. Interval Heartbeat (Every 30 seconds)
    // This ensures that if the browser crashes, the "Online" status will expire 
    // on other clients after 2 minutes (threshold check).
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    // 3. Handle Visibility Change (Tab Switch / Minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setOffline();
      } else {
        sendHeartbeat();
      }
    };

    // 4. Handle Page Hide / Unload (Browser Close)
    // 'pagehide' is more reliable on mobile iOS than 'beforeunload'
    const handlePageHide = () => {
        // We use sendBeacon if possible for a last-gasp network request, 
        // but since we are using Firestore directly, we try a sync update or just standard update.
        // Firestore SDK might not complete in time, but the Heartbeat expiry logic
        // on the viewing client is the fallback safety net.
        setOffline();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      setOffline(); // Cleanup on component unmount (logout)
    };
  }, [currentUser?.id]);


  // --- Real Firebase Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user details from Firestore
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            // Determine Admin status based on email from Firestore OR Auth
            const emailLower = (userData.email || firebaseUser.email || '').toLowerCase();
            const shouldBeAdmin = emailLower === 'goh@gmail.com';

            // Auto-promote in Firestore if strictly needed (fixes badge for others)
            if (shouldBeAdmin && (!userData.isAdmin || !userData.isOfficial)) {
                 await setDoc(doc(db, "users", firebaseUser.uid), { isAdmin: true, isOfficial: true }, { merge: true });
                 userData.isAdmin = true;
                 userData.isOfficial = true;
            }

            // Merge Auth data to ensure email is always present
            setCurrentUser({ 
                ...userData, 
                id: firebaseUser.uid,
                email: userData.email || firebaseUser.email || '',
                isOfficial: shouldBeAdmin || userData.isOfficial,
                isAdmin: shouldBeAdmin || userData.isAdmin
            });
          } else {
             // Fallback if doc doesn't exist yet (rare race condition on signup)
             const emailLower = firebaseUser.email?.toLowerCase() || '';
             const isAdmin = emailLower === 'goh@gmail.com';
             
             const fallbackUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                username: `@${firebaseUser.email?.split('@')[0]}`,
                avatarColor: 'bg-tg-accent',
                status: 'online',
                phone: '',
                isOfficial: isAdmin,
                isAdmin: isAdmin
             };
             setCurrentUser(fallbackUser);
          }
          setScreen(AppScreen.MAIN);
        } catch (e) {
          console.error("Error fetching user profile:", e);
          // Fallback logic for offline or error states
          const emailLower = firebaseUser.email?.toLowerCase() || '';
          const isAdmin = emailLower === 'goh@gmail.com';
          
          const fallbackUser: User = {
             id: firebaseUser.uid,
             name: firebaseUser.displayName || 'User',
             email: firebaseUser.email || '',
             username: `@${firebaseUser.email?.split('@')[0] || 'user'}`,
             avatarColor: 'bg-tg-accent',
             status: 'online',
             phone: '',
             isOfficial: isAdmin,
             isAdmin: isAdmin
          };
          setCurrentUser(fallbackUser);
          setScreen(AppScreen.MAIN);
        }
      } else {
        setCurrentUser(null);
        setScreen(AppScreen.AUTH);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Persistent Ban List ---
  const [systemBannedUserIds, setSystemBannedUserIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('hg_banned_users');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('hg_banned_users', JSON.stringify(Array.from(systemBannedUserIds)));
  }, [systemBannedUserIds]);

  // Other State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  
  // Security State
  const [passcode, setPasscode] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);

  const handleLogout = () => {
    // Set offline before signing out
    if (currentUser?.id) {
        updateDoc(doc(db, "users", currentUser.id), { 
            status: 'offline',
            lastSeen: Date.now()
        });
    }
    auth.signOut();
    setIsSidebarOpen(false);
  };

  const handleOpenChat = (chat: Chat) => {
    setActiveChat(chat);
    setScreen(AppScreen.CHAT);
  };

  const handleBackToMain = () => {
    setScreen(AppScreen.MAIN);
    setActiveChat(null);
  };

  const handleOpenProfile = () => {
    setIsSidebarOpen(false);
    setScreen(AppScreen.PROFILE);
  };

  const handleOpenAdmin = () => {
      setIsSidebarOpen(false);
      setScreen(AppScreen.ADMIN);
  };

  const handleOpenUserInfo = (user: User) => {
    setViewingUser(user);
    setScreen(AppScreen.USER_INFO);
  };

  // Update Profile in Firestore
  const handleUpdateProfile = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    if (currentUser?.id) {
       try {
           await setDoc(doc(db, "users", currentUser.id), updatedUser, { merge: true });
       } catch (e) {
           console.error("Failed to update profile", e);
       }
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleBlockUser = (userId: string) => {
    // Local block implementation
  };

  const handleSystemBan = (userId: string) => {
      setSystemBannedUserIds(prev => new Set(prev).add(userId));
  };

  const handleSystemUnban = (userId: string) => {
      setSystemBannedUserIds(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
      });
  };

  // Helper for Admin Panel - Fetch all users once
  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    if (screen === AppScreen.ADMIN && (currentUser?.isAdmin || currentUser?.email === 'goh@gmail.com')) {
        const fetchAll = async () => {
            const snap = await getDocs(collection(db, 'users'));
            const users = snap.docs.map(d => d.data() as User);
            setAllUsers(users);
        }
        fetchAll();
    }
  }, [screen, currentUser]);

  if (isLoading) {
      return <div className="h-[100dvh] w-full bg-tg-bg flex items-center justify-center text-white">Loading HouseGram...</div>;
  }

  return (
    <div className="flex w-full bg-tg-bg overflow-hidden relative" style={{ height: '100dvh' }}>
      
      {/* Global Snow Effect */}
      {snowEnabled && <SnowEffect />}

      {screen === AppScreen.AUTH && (
        <AuthScreen />
      )}

      {screen === AppScreen.MAIN && currentUser && (
        <div className="w-full flex flex-col h-full relative z-10">
          <ChatList 
            currentUser={currentUser}
            onOpenSidebar={toggleSidebar} 
            onOpenChat={handleOpenChat}
          />
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            onOpenProfile={handleOpenProfile}
            onOpenAdmin={handleOpenAdmin}
            currentUser={currentUser}
          />
        </div>
      )}

      {screen === AppScreen.CHAT && activeChat && currentUser && (
        <ChatScreen 
          chat={activeChat}
          currentUser={currentUser} 
          isBlocked={false} 
          onBack={handleBackToMain} 
          onOpenUserInfo={handleOpenUserInfo}
          storageUsage={storageStats.total}
          onFileUpload={handleFileUpload}
        />
      )}

      {screen === AppScreen.PROFILE && currentUser && (
        <ProfileScreen 
          user={currentUser} 
          onBack={() => setScreen(AppScreen.MAIN)} 
          onUpdate={handleUpdateProfile}
          onLogout={handleLogout}
          onOpenFeatures={() => setScreen(AppScreen.FEATURES)}
          onOpenPrivacy={() => setScreen(AppScreen.PRIVACY)}
          onOpenFAQ={() => setScreen(AppScreen.FAQ)}
          onOpenNotifications={() => setScreen(AppScreen.NOTIFICATIONS)}
          onOpenGuide={() => setScreen(AppScreen.GUIDE)}
          onOpenDataStorage={() => setScreen(AppScreen.DATA_STORAGE)}
        />
      )}

      {screen === AppScreen.USER_INFO && viewingUser && currentUser && (
        <UserInfoScreen 
          user={viewingUser} 
          currentUser={currentUser}
          isBlocked={false}
          onBack={() => setScreen(AppScreen.CHAT)} 
          onBlock={() => handleBlockUser(viewingUser.id)}
          onDelete={() => handleBackToMain()}
        />
      )}

      {screen === AppScreen.ADMIN && (currentUser?.isAdmin || currentUser?.email === 'goh@gmail.com') && (
          <AdminPanel 
            onBack={() => setScreen(AppScreen.MAIN)}
            users={allUsers}
            bannedUserIds={systemBannedUserIds}
            onBanUser={handleSystemBan}
            onUnbanUser={handleSystemUnban}
          />
      )}

      {screen === AppScreen.FEATURES && <FeaturesScreen onBack={() => setScreen(AppScreen.PROFILE)} />}
      {screen === AppScreen.PRIVACY && currentUser && (
          <PrivacyScreen 
            onBack={() => setScreen(AppScreen.PROFILE)} 
            passcode={passcode} 
            setPasscode={setPasscode} 
            recoveryEmail={recoveryEmail} 
            setRecoveryEmail={setRecoveryEmail}
            user={currentUser}
            onUpdateUser={handleUpdateProfile}
          />
      )}
      {screen === AppScreen.FAQ && <FAQScreen onBack={() => setScreen(AppScreen.PROFILE)} />}
      {screen === AppScreen.NOTIFICATIONS && <NotificationScreen onBack={() => setScreen(AppScreen.PROFILE)} />}
      {screen === AppScreen.GUIDE && <GuideScreen onBack={() => setScreen(AppScreen.PROFILE)} />}
      {screen === AppScreen.DATA_STORAGE && <DataStorageScreen onBack={() => setScreen(AppScreen.PROFILE)} storageStats={storageStats} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
