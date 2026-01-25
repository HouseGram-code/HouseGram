
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
import { LanguageProvider } from './LanguageContext.tsx';
import { auth, db } from './firebase.ts';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<AppScreen>(AppScreen.AUTH);
  const [isLoading, setIsLoading] = useState(true);

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
      return <div className="h-screen w-full bg-tg-bg flex items-center justify-center text-white">Loading HouseGram...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-tg-bg overflow-hidden relative">
      {screen === AppScreen.AUTH && (
        <AuthScreen />
      )}

      {screen === AppScreen.MAIN && currentUser && (
        <div className="w-full flex flex-col h-full relative">
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
          isBlocked={false} // Implement real blocking later
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

      {screen === AppScreen.USER_INFO && viewingUser && (
        <UserInfoScreen 
          user={viewingUser} 
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
      {screen === AppScreen.PRIVACY && <PrivacyScreen onBack={() => setScreen(AppScreen.PROFILE)} passcode={passcode} setPasscode={setPasscode} recoveryEmail={recoveryEmail} setRecoveryEmail={setRecoveryEmail} />}
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
