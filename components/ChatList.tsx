
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
            text: 'HouseGram updated to v0.01.1',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: false,
            type: 'text'
        },
        unreadCount: 3,
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
                    text: 'HouseGram updated to v0.01.1',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    senderId: NEWS_BOT_USER.id,
                    type: 'text'
                }
            });

            // Message 1: Update & Changelog
            await addDoc(collection(db, "chats", newChatRef.id, "messages"), {
                senderId: NEWS_BOT_USER.id,
                text: '🚀 **HouseGram v0.01.1**\n\nWe have fixed minor bugs and improved overall stability. The app is now smoother and more reliable than ever.\n\nEnjoy the update!',
                timestamp: new Date(Date.now() - 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestampRaw: Date.now() - 120000,
                isRead: true,
                type: 'text'
            });

             // Message 2: Scheduling Demo (Video)
            await addDoc(collection(db, "chats", newChatRef.id, "messages"), {
                senderId: NEWS_BOT_USER.id,
                text: '📅 **Schedule Messages**\n\nPlan your messages perfectly. You can now schedule messages to be sent at a specific time.\n\n**How to use:**\n1. Type your message.\n2. **Long press** the Send button.\n3. Select "Schedule Message" and pick a date.\n\nTry it out today!',
                mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-typing-on-a-smartphone-1680-large.mp4',
                timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestampRaw: Date.now() - 60000,
                isRead: true,
                type: 'video'
            });

             // Message 3: Last Seen Privacy Demo (Video)
             await addDoc(collection(db, "chats", newChatRef.id, "messages"), {
                senderId: NEWS_BOT_USER.id,
                text: '👀 **Last Seen & Online Privacy**\n\nYou now have granular control over who sees your status. \n\nWe adhere to the **Reciprocity Rule**: if you hide your Last Seen time from others (by selecting "Nobody"), you will not be able to see their Last Seen time either.\n\nGo to **Settings > Privacy** to configure this.',
                mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-scrolling-on-smartphone-in-the-dark-1686-large.mp4',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestampRaw: Date.now(),
                isRead: true,
                type: 'video'
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
      <div className="px-4 pb-2.5 pt-safe bg-tg-sidebar flex items-center justify-between shadow-sm z-20 border-b border-white/5 min-h-[60px] h-auto">
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
                            currentUser={currentUser}
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
                    <ChatItem key={chat.id} chat={chat} onClick={() => handleChatClick(chat)} currentUser={currentUser} />
                ))
            )
        )}
      </div>

      {!isSearching && (
        <button 
          onClick={() => setIsSearching(true)} 
          className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-tg-accent text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(42,171,238,0.4)] hover:brightness-110 hover:-translate-y-1 active:scale-95 transition-all z-30"
        >
          <Pencil size={24} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default ChatList;
    