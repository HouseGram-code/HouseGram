
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, Ban, Megaphone, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Chat, Message, User } from '../types.ts';
import MessageBubble from './MessageBubble.tsx';
import VoiceMessage from './VoiceMessage.tsx';
import InputBar from './InputBar.tsx';
import { useLanguage } from '../LanguageContext.tsx';
import { db } from '../firebase.ts';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface ChatScreenProps {
  chat: Chat;
  currentUser: User;
  isBlocked: boolean;
  onBack: () => void;
  onOpenUserInfo: (user: User) => void;
  storageUsage: number;
  onFileUpload: (size: number, category: 'media' | 'files' | 'voice') => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ 
    chat, currentUser, isBlocked, onBack, onOpenUserInfo, storageUsage, onFileUpload 
}) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  // Subscribe to messages subcollection
  useEffect(() => {
    if (!chat.id || chat.id === 'news-placeholder') return;
    
    const msgsRef = collection(db, "chats", chat.id, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedMsgs = snapshot.docs.map(d => ({
            ...d.data(),
            id: d.id
        })) as Message[];
        setMessages(loadedMsgs);
        
        // Auto scroll to bottom
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    });

    return () => unsubscribe();
  }, [chat.id]);

  const handleSendMessage = async (text: string, type: Message['type'], mediaUrl?: string, meta?: string) => {
    if (isBlocked || chat.isReadOnly || sending) return;
    
    let interactiveEmoji: Message['interactiveEmoji'] | undefined;
    const cleanText = text ? text.trim() : '';

    if (type === 'text') {
        if (cleanText === '🎲') {
            interactiveEmoji = { type: 'dice', value: Math.floor(Math.random() * 6) + 1 };
        } else if (cleanText === '🏀') {
            interactiveEmoji = { type: 'basketball', value: Math.floor(Math.random() * 5) + 1 }; 
        } else if (cleanText === '🎯') {
            interactiveEmoji = { type: 'dart', value: Math.floor(Math.random() * 6) + 1 }; 
        }
    }

    // STRICT FIX: Ensure NO field is undefined. Use null.
    const newMessageData = {
      senderId: currentUser.id || 'unknown',
      text: (type === 'file' || type === 'audio') ? null : (cleanText || null),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestampRaw: Date.now(),
      isRead: false,
      type: type,
      audioUrl: (type === 'voice' || type === 'audio') ? (mediaUrl || null) : null,
      duration: (type === 'voice' || type === 'audio') ? (meta || null) : null,
      mediaUrl: (type === 'image' || type === 'video' || type === 'file') ? (mediaUrl || null) : null,
      mediaSize: (type === 'file' || type === 'video' || type === 'image') ? (meta || null) : null,
      mediaName: (type === 'file' || type === 'audio') ? (text || null) : null,
      interactiveEmoji: interactiveEmoji || null
    };

    try {
        // Add message to subcollection
        await addDoc(collection(db, "chats", chat.id, "messages"), newMessageData);
        
        // Update last message in chat doc
        await updateDoc(doc(db, "chats", chat.id), {
            lastMessage: newMessageData,
            updatedAt: Date.now()
        });

    } catch (e) {
        console.error("Error sending message", e);
    }
  };

  return (
    <div className="flex flex-col w-full bg-tg-bg relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-tg-pattern bg-repeat opacity-[0.03] pointer-events-none" />

      {/* Mobile-optimized Header */}
      <div className="z-10 bg-tg-sidebar px-2 py-2 flex items-center justify-between border-b border-tg-border/50 shadow-md h-[60px] shrink-0">
        <div className="flex items-center w-full overflow-hidden">
          <button onClick={onBack} className="p-3 mr-1 text-white hover:bg-white/5 rounded-full transition-colors flex-shrink-0 active:scale-95">
            <ArrowLeft size={22} />
          </button>
          
          <div 
            onClick={() => onOpenUserInfo(chat.user)} 
            className="flex items-center flex-1 cursor-pointer overflow-hidden group py-1 active:opacity-70 transition-opacity"
          >
            <div className={`w-10 h-10 rounded-full flex-shrink-0 ${chat.user.avatarColor} flex items-center justify-center font-bold text-white shadow-sm border border-white/5 relative overflow-hidden mr-3`}>
              {chat.user.avatarUrl ? (
                 chat.user.isVideoAvatar ? (
                    <video src={chat.user.avatarUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                 ) : (
                    <img src={chat.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                 )
              ) : (
                chat.user.name.charAt(0)
              )}
            </div>
            <div className="flex flex-col overflow-hidden justify-center">
              <span className="text-white font-bold text-[16px] leading-tight truncate flex items-center">
                {chat.user.name}
                {chat.user.isAdmin ? (
                   <ShieldCheck size={14} className="ml-1 text-amber-500 shrink-0" fill="currentColor" stroke="black" strokeWidth={1} />
                ) : chat.isReadOnly || chat.user.isOfficial ? (
                   <BadgeCheck size={14} className="ml-1 text-tg-accent shrink-0" fill="#2AABEE" stroke="white" />
                ) : null}
              </span>
              <span className="text-[13px] truncate text-tg-online opacity-80 leading-tight">
                {chat.isReadOnly ? 'service notifications' : t('online')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 relative z-0 flex flex-col pb-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 space-y-4 select-none pb-12">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <MessageCircle size={48} className="text-white" />
            </div>
            <div className="text-center px-4">
              <p className="text-white font-bold text-lg mb-1">{t('noMessages')}</p>
              <p className="text-sm text-tg-secondary">{t('noMessagesSub')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="self-center bg-tg-sidebar/60 backdrop-blur-md text-[12px] font-medium px-3 py-1 rounded-full text-white/70 border border-white/5 my-2 shadow-sm">
              {t('today')}
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} animate-fadeIn w-full`}>
                {(msg.type === 'voice' || msg.type === 'audio') ? (
                  <VoiceMessage message={msg} isOutgoing={msg.senderId === currentUser.id} />
                ) : (
                  <MessageBubble message={msg} isOutgoing={msg.senderId === currentUser.id} />
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {isBlocked ? (
        <div className="z-10 bg-tg-sidebar px-4 py-4 flex items-center justify-center space-x-2 border-t border-tg-border/50 text-red-400 font-medium pb-safe">
          <Ban size={18} />
          <span>{t('userBlockedMsg')}</span>
        </div>
      ) : chat.isReadOnly ? (
        <div className="z-10 bg-tg-sidebar px-4 py-3 flex items-center justify-center border-t border-tg-border/50 pb-safe">
             <div className="flex items-center space-x-2 bg-tg-accent/10 px-4 py-1.5 rounded-full border border-tg-accent/20">
                <BadgeCheck size={16} className="text-tg-accent" fill="#2AABEE" stroke="white" />
                <span className="text-tg-accent font-bold text-xs uppercase tracking-wide">Official Channel</span>
             </div>
        </div>
      ) : (
        <InputBar 
          onSend={handleSendMessage} 
          storageUsage={storageUsage}
          onFileUpload={onFileUpload}
        />
      )}
    </div>
  );
};

export default ChatScreen;
