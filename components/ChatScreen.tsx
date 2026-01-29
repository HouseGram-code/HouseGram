
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Search, Paperclip, Smile, Mic, Send } from 'lucide-react';
import { Chat, Message, User, formatLastSeen } from '../types.ts';
import MessageBubble from './MessageBubble.tsx';
import InputBar from './InputBar.tsx';
import { useLanguage } from '../LanguageContext.tsx';
import { db } from '../firebase.ts';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface ChatScreenProps {
  chat: Chat;
  currentUser: User;
  onBack: () => void;
  onOpenUserInfo: (user: User) => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ chat, currentUser, onBack, onOpenUserInfo }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chat.id) return;
    const msgsQuery = query(collection(db, "chats", chat.id, "messages"), orderBy("timestampRaw", "asc"));
    return onSnapshot(msgsQuery, (snapshot) => {
        setMessages(snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Message[]);
        setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100);
    });
  }, [chat.id]);

  const handleSend = async (text: string, type: Message['type'] = 'text') => {
      const msg = {
          senderId: currentUser.id,
          text,
          type,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestampRaw: Date.now(),
          isRead: false
      };
      await addDoc(collection(db, "chats", chat.id, "messages"), msg);
      await updateDoc(doc(db, "chats", chat.id), { lastMessage: msg, updatedAt: Date.now() });
  };

  return (
    <div className="flex flex-col h-full w-full bg-wa-bg dark:bg-wa-darkBg relative overflow-hidden">
      {/* WhatsApp Chat Header */}
      <div className="bg-wa-teal dark:bg-wa-darkSidebar text-white pt-safe pb-2 px-2 flex items-center shadow-md z-30">
        <button onClick={onBack} className="p-2 -ml-1"><ArrowLeft size={24} /></button>
        <div className="flex flex-1 items-center ml-1 cursor-pointer" onClick={() => onOpenUserInfo(chat.user)}>
            <div className={`w-10 h-10 rounded-full ${chat.user.avatarColor} flex items-center justify-center font-bold text-white mr-3 overflow-hidden`}>
                {chat.user.avatarUrl ? <img src={chat.user.avatarUrl} className="w-full h-full object-cover" /> : chat.user.name.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="font-bold truncate text-[16px] leading-tight">{chat.user.name}</span>
                <span className="text-[12px] opacity-80">{formatLastSeen(chat.user, t, currentUser)}</span>
            </div>
        </div>
        <div className="flex items-center space-x-3 pr-2">
            <Video size={22} className="opacity-90" />
            <Phone size={20} className="opacity-90" />
            <MoreVertical size={22} className="opacity-90" />
        </div>
      </div>

      {/* Messages Area with Doodle Pattern */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto bg-wa-pattern bg-[length:400px] opacity-100 p-4 space-y-2 relative no-scrollbar"
        style={{ backgroundColor: '#e5ddd5' }}
      >
        <div className="absolute inset-0 bg-[#e5ddd5] dark:bg-wa-darkBg -z-10" />
        <div className="bg-amber-100 dark:bg-amber-900/20 text-black/70 dark:text-white/70 text-[12px] py-1 px-3 rounded-lg mx-auto w-fit text-center mb-4 shadow-sm">
            🔒 Messages and calls are end-to-end encrypted.
        </div>
        
        {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} isOutgoing={msg.senderId === currentUser.id} />
        ))}
      </div>

      {/* WhatsApp Style Input */}
      <InputBar onSend={handleSend} currentUser={currentUser} storageUsage={0} onFileUpload={() => {}} />
    </div>
  );
};

export default ChatScreen;
