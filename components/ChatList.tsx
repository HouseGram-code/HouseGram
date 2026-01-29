
import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Search, MoreVertical, Camera, MessageSquare, MessageCircle, Users, Phone } from 'lucide-react';
import { Chat, User } from '../types.ts';
import ChatItem from './ChatItem.tsx';
import { useLanguage } from '../LanguageContext.tsx';
import { db } from '../firebase.ts';
import { collection, query, where, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { NEWS_BOT_USER } from '../constants.ts';

interface ChatListProps {
  currentUser: User;
  onOpenSidebar: () => void;
  onOpenChat: (chat: Chat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ currentUser, onOpenSidebar, onOpenChat }) => {
  const { t } = useLanguage();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'status' | 'calls'>('chats');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!currentUser.id) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.id));
    return onSnapshot(q, (snapshot) => {
        const loadedChats = snapshot.docs.map(doc => {
            const data = doc.data();
            const otherUser = (data.users || []).find((u: User) => u.id !== currentUser.id) || currentUser;
            return {
                id: doc.id,
                user: otherUser,
                lastMessage: data.lastMessage || { text: 'New chat', timestamp: '', type: 'text' },
                unreadCount: 0,
                type: data.type || 'private'
            } as Chat;
        }).sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setChats(loadedChats);
    });
  }, [currentUser.id]);

  return (
    <div className="flex flex-col h-full bg-tg-bg overflow-hidden">
      {/* WhatsApp Header */}
      <div className="bg-wa-teal dark:bg-wa-darkSidebar text-white pt-safe px-4 pb-2 wa-header-shadow z-30">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-xl font-bold tracking-wide">WhatsAppGram</h1>
          <div className="flex items-center space-x-4">
            <Camera size={22} className="opacity-80" />
            <button onClick={() => setIsSearching(true)}><Search size={22} className="opacity-80" /></button>
            <button onClick={onOpenSidebar}><MoreVertical size={22} className="opacity-80" /></button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center mt-2 relative">
           <TabItem label="CHATS" active={activeTab === 'chats'} onClick={() => setActiveTab('chats')} badge={chats.length} />
           <TabItem label="STATUS" active={activeTab === 'status'} onClick={() => setActiveTab('status')} />
           <TabItem label="CALLS" active={activeTab === 'calls'} onClick={() => setActiveTab('calls')} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'chats' && (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {chats.map(chat => (
               <ChatItem key={chat.id} chat={chat} onClick={() => onOpenChat(chat)} currentUser={currentUser} />
            ))}
          </div>
        )}
        {activeTab === 'status' && (
           <div className="p-10 text-center text-tg-secondary">
              <div className="w-20 h-20 bg-wa-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                 <MessageCircle size={40} className="text-wa-green" />
              </div>
              <p className="font-bold">No status updates</p>
           </div>
        )}
        {activeTab === 'calls' && (
           <div className="p-10 text-center text-tg-secondary">
              <p>To start calling contacts who have WhatsAppGram, tap the call icon at the bottom of your screen.</p>
           </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button className="absolute bottom-6 right-6 w-14 h-14 bg-wa-green text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-20">
        {activeTab === 'chats' ? <MessageSquare size={24} /> : (activeTab === 'status' ? <Camera size={24} /> : <Phone size={24} />)}
      </button>
    </div>
  );
};

const TabItem = ({ label, active, onClick, badge }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-3 text-sm font-bold transition-all relative ${active ? 'text-white' : 'text-white/60'}`}
  >
    <div className="flex items-center justify-center space-x-1">
      <span>{label}</span>
      {badge > 0 && <span className="bg-white text-wa-teal text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>}
    </div>
    {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white" />}
  </button>
);

export default ChatList;
