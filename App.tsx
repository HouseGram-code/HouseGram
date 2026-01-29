
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
import MaintenanceScreen from './components/MaintenanceScreen.tsx';
import { LanguageProvider } from './LanguageContext.tsx';
import { auth, db } from './firebase.ts';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, onSnapshot } from "firebase/firestore";

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<AppScreen>(AppScreen.AUTH);
  const [isLoading, setIsLoading] = useState(true);
  const [snowEnabled, setSnowEnabled] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [storageStats, setStorageStats] = useState<StorageStats>(() => {
    try {
        const saved = localStorage.getItem('hg_storage_stats');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return { media: 0, files: 0, voice: 0, total: 0 };
  });

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'system', 'settings'), (doc) => {
          if (doc.exists()) {
              const data = doc.data();
              setSnowEnabled(data?.snowEnabled || false);
              setMaintenanceMode(data?.maintenanceMode || false);
          }
      }, (error) => console.log(error));
      return () => unsub();
    } catch (e) { return () => {}; }
  }, []);

  const handleFileUpload = (size: number, category: 'media' | 'files' | 'voice') => {
    if (typeof size !== 'number' || isNaN(size)) return;
    setStorageStats(prev => ({
      ...prev,
      [category]: prev[category] + size,
      total: prev.total + size
    }));
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    const userStatusRef = doc(db, "users", currentUser.id);
    const sendHeartbeat = async () => {
      if (document.visibilityState === 'visible') {
        try { await updateDoc(userStatusRef, { status: 'online', lastSeen: Date.now() }); } catch (e) {}
      }
    };
    const setOffline = async () => { try { await updateDoc(userStatusRef, { status: 'offline', lastSeen: Date.now() }); } catch (e) {} };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);
    const handleVisibilityChange = () => document.visibilityState === 'hidden' ? setOffline() : sendHeartbeat();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setOffline();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;
    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        if (userUnsubscribe) userUnsubscribe();
        userUnsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data() as User;
              const emailLower = (userData.email || firebaseUser.email || '').toLowerCase();
              const shouldBeAdmin = emailLower === 'goh@gmail.com';
              setCurrentUser({
                ...userData,
                id: firebaseUser.uid,
                email: userData.email || firebaseUser.email || '',
                isOfficial: shouldBeAdmin || userData.isOfficial,
                isAdmin: shouldBeAdmin || userData.isAdmin
              });
              setScreen(prev => (prev === AppScreen.AUTH ? AppScreen.MAIN : prev));
            }
            setIsLoading(false);
          }, (err) => {
             const emailLower = firebaseUser.email?.toLowerCase() || '';
             const isAdmin = emailLower === 'goh@gmail.com';
             setCurrentUser({ id: firebaseUser.uid, name: firebaseUser.displayName || 'User', email: firebaseUser.email || '', username: `@${firebaseUser.email?.split('@')[0] || 'user'}`, avatarColor: 'bg-tg-accent', status: 'online', phone: '', isOfficial: isAdmin, isAdmin: isAdmin });
             setScreen(prev => (prev === AppScreen.AUTH ? AppScreen.MAIN : prev));
             setIsLoading(false);
          });
      } else {
        if (userUnsubscribe) userUnsubscribe();
        setCurrentUser(null);
        setScreen(AppScreen.AUTH);
        setIsLoading(false);
      }
    });
    return () => { authUnsubscribe(); if (userUnsubscribe) userUnsubscribe(); };
  }, []);

  const [systemBannedUserIds, setSystemBannedUserIds] = useState<Set<string>>(() => {
    try { const saved = localStorage.getItem('hg_banned_users'); return saved ? new Set(JSON.parse(saved)) : new Set(); } catch(e) { return new Set(); }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);

  const handleLogout = () => { if (currentUser?.id) updateDoc(doc(db, "users", currentUser.id), { status: 'offline', lastSeen: Date.now() }).catch(() => {}); auth.signOut(); setIsSidebarOpen(false); };
  const handleOpenChat = (chat: Chat) => { setActiveChat(chat); setScreen(AppScreen.CHAT); };
  const handleBackToMain = () => { setScreen(AppScreen.MAIN); setActiveChat(null); };
  const handleOpenProfile = () => { setIsSidebarOpen(false); setScreen(AppScreen.PROFILE); };
  const handleOpenAdmin = () => { setIsSidebarOpen(false); setScreen(AppScreen.ADMIN); };

  const handleOpenSavedMessages = async () => {
      if (!currentUser) return;
      setIsSidebarOpen(false);
      const chatId = `saved_${currentUser.id}`;
      try {
          const chatRef = doc(db, "chats", chatId);
          const chatSnap = await getDoc(chatRef);
          if (!chatSnap.exists()) {
              await setDoc(chatRef, { 
                participants: [currentUser.id], 
                users: [currentUser], 
                type: 'private', 
                updatedAt: Date.now(), 
                lastMessage: { text: 'Welcome to your personal cloud!', timestamp: new Date().toLocaleTimeString(), senderId: 'system', type: 'text' } 
              });
          }
      } catch (e) { console.error(e); }
      const savedChat: Chat = { 
        id: chatId, 
        user: currentUser, 
        lastMessage: { id: '', text: '', timestamp: '', isRead: true, type: 'text', senderId: '' }, 
        unreadCount: 0, 
        type: 'private' 
      };
      handleOpenChat(savedChat);
  };

  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    if (screen === AppScreen.ADMIN && (currentUser?.isAdmin || currentUser?.email === 'goh@gmail.com')) {
        const fetchAll = async () => { try { const snap = await getDocs(collection(db, 'users')); setAllUsers(snap.docs.map(d => d.data() as User)); } catch (e) { console.error(e); } }
        fetchAll();
    }
  }, [screen, currentUser]);

  if (isLoading) return <div className="h-[100dvh] w-full bg-tg-bg flex items-center justify-center text-white font-bold tracking-widest animate-pulse">LOADING...</div>;

  // КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Если режим обслуживания включен, показываем экран всем, кто не админ
  const isAdmin = currentUser?.isAdmin || currentUser?.email?.toLowerCase() === 'goh@gmail.com';
  if (maintenanceMode && !isAdmin) return <LanguageProvider><MaintenanceScreen /></LanguageProvider>;

  return (
    <div className="flex w-full bg-tg-bg overflow-hidden relative" style={{ height: '100dvh' }}>
      {snowEnabled && <SnowEffect />}
      {screen === AppScreen.AUTH && <AuthScreen />}
      {screen === AppScreen.MAIN && currentUser && (
        <div className="w-full flex flex-col h-full relative z-10">
          <ChatList currentUser={currentUser} onOpenSidebar={() => setIsSidebarOpen(true)} onOpenChat={handleOpenChat} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpenProfile={handleOpenProfile} onOpenAdmin={handleOpenAdmin} onOpenSavedMessages={handleOpenSavedMessages} currentUser={currentUser} />
        </div>
      )}
      {screen === AppScreen.CHAT && activeChat && currentUser && (
        <ChatScreen chat={activeChat} currentUser={currentUser} onBack={handleBackToMain} onOpenUserInfo={(u) => { setViewingUser(u); setScreen(AppScreen.USER_INFO); }} />
      )}
      {screen === AppScreen.PROFILE && currentUser && (
        <ProfileScreen user={currentUser} onBack={() => setScreen(AppScreen.MAIN)} onUpdate={(u) => { setCurrentUser(u); if (currentUser?.id) setDoc(doc(db, "users", currentUser.id), u, { merge: true }); }} onLogout={handleLogout} onOpenFeatures={() => setScreen(AppScreen.FEATURES)} onOpenPrivacy={() => setScreen(AppScreen.PRIVACY)} onOpenFAQ={() => setScreen(AppScreen.FAQ)} onOpenNotifications={() => setScreen(AppScreen.NOTIFICATIONS)} onOpenGuide={() => setScreen(AppScreen.GUIDE)} onOpenDataStorage={() => setScreen(AppScreen.DATA_STORAGE)} />
      )}
      {screen === AppScreen.USER_INFO && viewingUser && currentUser && (
        <UserInfoScreen user={viewingUser} currentUser={currentUser} isBlocked={false} onBack={() => setScreen(AppScreen.CHAT)} onBlock={() => {}} onDelete={() => handleBackToMain()} />
      )}
      {screen === AppScreen.ADMIN && isAdmin && (
          <AdminPanel onBack={() => setScreen(AppScreen.MAIN)} users={allUsers} bannedUserIds={systemBannedUserIds} onBanUser={(uid) => setSystemBannedUserIds(p => new Set(p).add(uid))} onUnbanUser={(uid) => setSystemBannedUserIds(p => { const n = new Set(p); n.delete(uid); return n; })} />
      )}
      {screen === AppScreen.FEATURES && <FeaturesScreen onBack={() => setScreen(AppScreen.PROFILE)} />}
      {screen === AppScreen.PRIVACY && currentUser && <PrivacyScreen onBack={() => setScreen(AppScreen.PROFILE)} passcode={passcode} setPasscode={setPasscode} recoveryEmail={recoveryEmail} setRecoveryEmail={setRecoveryEmail} user={currentUser} onUpdateUser={(u) => { setCurrentUser(u); setDoc(doc(db, "users", u.id), u, { merge: true }); }} />}
      {screen === AppScreen.FAQ && <FAQScreen onBack={() => setScreen(AppScreen.PROFILE)} />}
      {screen === AppScreen.NOTIFICATIONS && <NotificationScreen onBack={() => setScreen(AppScreen.PROFILE)} />}
      {screen === AppScreen.GUIDE && <GuideScreen onBack={() => setScreen(AppScreen.PROFILE)} />}
      {screen === AppScreen.DATA_STORAGE && <DataStorageScreen onBack={() => setScreen(AppScreen.PROFILE)} storageStats={storageStats} />}
    </div>
  );
};

const App: React.FC = () => <LanguageProvider><AppContent /></LanguageProvider>;
export default App;
