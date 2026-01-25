
import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Search, Pencil, MessageSquareOff, ArrowLeft, X, Loader2, Megaphone } from 'lucide-react';
import { Chat, User } from '../types.ts';
import ChatItem from './ChatItem.tsx';
import { useLanguage } from '../LanguageContext.tsx';
import { db } from '../firebase.ts';
import { collection, query, where, onSnapshot, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { NEWS_BOT_USER } from '../constants.ts';

interface ChatListProps {
  currentUser: User;
  onOpenSidebar: () => void;
  onOpenChat: (chat: Chat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ 
  currentUser,
  onOpenSidebar, 
  onOpenChat,
}) => {
  const { t } = useLanguage();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  // Real-time Chats Listener
  useEffect(() => {
    if (!currentUser.id) return;

    const q = query(
        collection(db, "chats"), 
        where("participants", "array-contains", currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const rawChats = snapshot.docs
            .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        const uniqueUserIds = new Set<string>();
        const loadedChats: Chat[] = [];

        rawChats.forEach(data => {
            const usersList = data.users || [];
            const otherUser = usersList.find((u: User) => u.id !== currentUser.id) || currentUser;
            
            if (otherUser && !uniqueUserIds.has(otherUser.id)) {
                uniqueUserIds.add(otherUser.id);
                
                loadedChats.push({
                    id: data.id,
                    user: otherUser,
                    lastMessage: data.lastMessage || { text: 'No messages yet', timestamp: '', type: 'text' },
                    unreadCount: 0,
                    type: data.type || 'private',
                    isReadOnly: data.isReadOnly
                } as Chat);
            }
        });

        setChats(loadedChats);
    }, (error) => {
        console.error("Firestore Chats Listener Error:", error);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  const displayChats = useMemo(() => {
    const hasNewsChat = chats.some(c => c.user.id === NEWS_BOT_USER.id);
    if (hasNewsChat) return chats;

    const newsPlaceholder: Chat = {
        id: 'news-placeholder',
        user: NEWS_BOT_USER,
        lastMessage: {
            id: 'intro',
            senderId: NEWS_BOT_USER.id,
            text: 'Welcome to HouseGram! 👋',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: false,
            type: 'text'
        },
        unreadCount: 1,
        type: 'channel',
        isReadOnly: true
    };

    return [newsPlaceholder, ...chats];
  }, [chats]);

  useEffect(() => {
    const doSearch = async () => {
        if (!searchQuery.trim() || !isSearching) {
            setSearchResults([]);
            return;
        }

        setLoadingSearch(true);
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef); 
            const snap = await getDocs(q);
            
            const term = searchQuery.toLowerCase();
            const results = snap.docs
                .map(d => d.data() as User)
                .filter(u => 
                    u.id !== currentUser.id && 
                    (u.username?.toLowerCase().includes(term) || u.name.toLowerCase().includes(term))
                )
                .slice(0, 10);
            
            setSearchResults(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSearch(false);
        }
    };

    const delay = setTimeout(doSearch, 500);
    return () => clearTimeout(delay);
  }, [searchQuery, isSearching, currentUser.id]);

  const handleChatClick = async (chat: Chat) => {
      if (chat.id === 'news-placeholder') {
        try {
            const newChatRef = await addDoc(collection(db, "chats"), {
                participants: [currentUser.id, NEWS_BOT_USER.id],
                users: [currentUser, NEWS_BOT_USER],
                type: 'channel',
                isReadOnly: true,
                updatedAt: Date.now(),
                lastMessage: {
                    text: 'Interactive Welcome Demo',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    senderId: NEWS_BOT_USER.id,
                    type: 'text'
                }
            });

            // 1. High-Impact Welcome
            await addDoc(collection(db, "chats", newChatRef.id, "messages"), {
                senderId: NEWS_BOT_USER.id,
                text: '👋', // Will trigger Big Emoji animation
                timestamp: new Date(Date.now() - 10000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestampRaw: Date.now() - 10000,
                isRead: true,
                type: 'text'
            });

            await addDoc(collection(db, "chats", newChatRef.id, "messages"), {
                senderId: NEWS_BOT_USER.id,
                text: 'Welcome to **HouseGram News**!\n\nYou have just entered the world\'s most beautiful and fastest messaging platform. Let us show you around!',
                timestamp: new Date(Date.now() - 8000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestampRaw: Date.now() - 8000,
                isRead: true,
                type: 'text'
            });

             // 2. Structured Usage Guide
            await addDoc(collection(db, "chats", newChatRef.id, "messages"), {
                senderId: NEWS_BOT_USER.id,
                text: '🚀 **Mastering HouseGram**\n\n🔹 **Start Chatting**\nTap the **Pencil icon** ✏️ in the main list to find friends by name or username.\n\n🔹 **Voice Messages**\nTap the **Microphone** 🎤 to record. Use **Stop** to review or **Trash** to cancel.\n\n🔹 **Media & Files**\nSend anything! High-quality photos, videos, and music are supported via the **Paperclip icon** 📎.\n\n🔹 **Personalize**\nGo to **Settings** ⚙️ to set a custom profile video, bio, or change your theme language.',
                timestamp: new Date(Date.now() - 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestampRaw: Date.now() - 5000,
                isRead: true,
                type: 'text'
            });

             // 3. Animation & Interactive Demo
             await addDoc(collection(db, "chats", newChatRef.id, "messages"), {
                senderId: NEWS_BOT_USER.id,
                text: 'HouseGram brings messages to life with **Interactive Animations**. \n\n**Try it yourself:**\nSend a 🎲, 🏀, or 🎯 emoji to play! \n\n*Tap the basketball below to see a swish!*',
                timestamp: new Date(Date.now() - 2000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestampRaw: Date.now() - 2000,
                isRead: true,
                type: 'text'
            });

             await addDoc(collection(db, "chats", newChatRef.id, "messages"), {
                senderId: NEWS_BOT_USER.id,
                text: '🏀',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestampRaw: Date.now(),
                isRead: true,
                type: 'text',
                interactiveEmoji: { type: 'basketball', value: 5 }
            });

            const realChat: Chat = {
                ...chat,
                id: newChatRef.id
            };
            onOpenChat(realChat);
        } catch (e) {
            console.error("Error creating news chat", e);
        }
      } else {
        onOpenChat(chat);
      }
  };

  const handleUserClick = async (user: User) => {
    const existing = chats.find(c => c.user.id === user.id);
    if (existing) {
        onOpenChat(existing);
        setIsSearching(false);
        return;
    }

    try {
        const newChatRef = await addDoc(collection(db, "chats"), {
            participants: [currentUser.id, user.id],
            users: [currentUser, user],
            type: 'private',
            updatedAt: Date.now(),
            lastMessage: {
                text: 'Chat started',
                timestamp: new Date().toLocaleTimeString(),
                senderId: 'system',
                type: 'text'
            }
        });

        const newChat: Chat = {
            id: newChatRef.id,
            user: user,
            lastMessage: { id: 'sys', senderId: 'sys', text: '', timestamp: '', isRead: true, type: 'text' },
            unreadCount: 0,
            type: 'private'
        };
        
        onOpenChat(newChat);
        setIsSearching(false);
    } catch (e) {
        console.error("Error creating chat", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-tg-bg overflow-hidden">
      <div className="px-4 py-2.5 bg-tg-sidebar flex items-center justify-between shadow-sm z-20 border-b border-white/5 h-[60px]">
        {!isSearching ? (
          <>
            <div className="flex items-center space-x-5">
              <button onClick={onOpenSidebar} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full transition-all active:scale-90">
                <Menu size={24} strokeWidth={2.5} />
              </button>
              
               <h1 className="text-[19px] font-black text-white tracking-tight animate-fadeIn">{t('appName')}</h1>
            </div>
            <button onClick={() => setIsSearching(true)} className="p-2 text-white hover:bg-white/5 rounded-full transition-all active:scale-90">
              <Search size={24} />
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center space-x-2 animate-fadeIn">
            <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="p-2 -ml-2 text-tg-accent hover:bg-white/5 rounded-full transition-all active:scale-90">
              <ArrowLeft size={24} />
            </button>
            <input 
              autoFocus
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white border-none focus:outline-none text-[17px] placeholder-tg-secondary"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-2 text-tg-secondary hover:bg-white/5 rounded-full">
                <X size={20} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-1 bg-tg-bg">
        {isSearching ? (
           <div className="p-2">
               {loadingSearch && <div className="text-center p-4 text-white/50"><Loader2 className="animate-spin inline mr-2"/> Searching users...</div>}
               
               {searchResults.length > 0 && (
                   <>
                     <div className="px-4 py-2 text-xs font-bold text-tg-accent uppercase tracking-widest bg-tg-bg/30">{t('globalSearch')}</div>
                     {searchResults.map(user => (
                         <ChatItem 
                            key={user.id} 
                            chat={{ id: 'temp', user, lastMessage: {id:'', senderId:'', timestamp:'', isRead:true, type:'text'}, unreadCount:0, type:'private'}} 
                            onClick={() => handleUserClick(user)} 
                         />
                     ))}
                   </>
               )}
               {!loadingSearch && searchResults.length === 0 && searchQuery && (
                    <div className="text-center p-8 text-white/50">No users found. Try searching by username.</div>
               )}
           </div>
        ) : (
            displayChats.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-tg-sidebar flex items-center justify-center animate-pulse shadow-xl border border-white/5">
                        <MessageSquareOff size={40} className="text-tg-secondary opacity-40" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-white/40 font-bold text-lg">{t('noChats')}</p>
                        <p className="text-tg-secondary text-sm max-w-[200px] mx-auto">
                           Start searching to find friends!
                        </p>
                    </div>
                </div>
            ) : (
                displayChats.map((chat) => (
                    <ChatItem key={chat.id} chat={chat} onClick={() => handleChatClick(chat)} />
                ))
            )
        )}
      </div>

      {!isSearching && (
        <button onClick={() => setIsSearching(true)} className="absolute bottom-6 right-6 w-14 h-14 bg-tg-accent text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(42,171,238,0.4)] hover:brightness-110 hover:-translate-y-1 active:scale-95 transition-all z-30">
          <Pencil size={24} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default ChatList;
