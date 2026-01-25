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

    const newMessageData = {
      senderId: currentUser.id,
      text: (type === 'file' || type === 'audio') ? undefined : cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestampRaw: Date.now(),
      isRead: false,
      type: type,
      audioUrl: (type === 'voice' || type === 'audio') ? mediaUrl : undefined,
      duration: (type === 'voice' || type === 'audio') ? meta : undefined,
      mediaUrl: (type === 'image' || type === 'video' || type === 'file') ? mediaUrl : undefined,
      mediaSize: (type === 'file' || type === 'video' || type === 'image') ? meta : undefined,
      mediaName: (type === 'file' || type === 'audio') ? text : undefined,
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
    <div className="flex flex-col h-full w-full bg-tg-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-tg-pattern bg-repeat opacity-[0.03] pointer-events-none" />

      <div className="z-10 bg-tg-sidebar px-4 py-2 flex items-center justify-between border-b border-tg-border/50 shadow-md">
        <div className="flex items-center space-x-3 overflow-hidden">
          <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-tg-bg rounded-full transition-colors flex-shrink-0">
            <ArrowLeft size={24} />
          </button>
          
          <div 
            onClick={() => onOpenUserInfo(chat.user)} 
            className="flex items-center space-x-3 cursor-pointer overflow-hidden group"
          >
            <div className={`w-10 h-10 rounded-full flex-shrink-0 ${chat.user.avatarColor} flex items-center justify-center font-bold text-white shadow-sm group-hover:brightness-110 transition-all overflow-hidden relative`}>
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
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-bold leading-tight truncate group-hover:text-tg-accent transition-colors flex items-center">
                {chat.user.name}
                {chat.user.isAdmin ? (
                   <ShieldCheck size={14} className="ml-1 text-amber-500" fill="currentColor" stroke="black" strokeWidth={1} />
                ) : chat.isReadOnly || chat.user.isOfficial ? (
                   <BadgeCheck size={14} className="ml-1 text-tg-accent" fill="#2AABEE" stroke="white" />
                ) : null}
              </span>
              <span className="text-[12px] truncate text-tg-online">
                {chat.isReadOnly ? 'service notifications' : t('online')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 relative z-0 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 space-y-4 select-none">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <MessageCircle size={40} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold">{t('noMessages')}</p>
              <p className="text-[13px] text-tg-secondary">{t('noMessagesSub')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="self-center bg-tg-sidebar/60 backdrop-blur-md text-[13px] px-3 py-1 rounded-full text-white/80 border border-white/5 my-4">
              {t('today')}
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
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
        <div className="z-10 bg-tg-sidebar px-4 py-4 flex items-center justify-center space-x-2 border-t border-tg-border/50 text-red-400 font-medium">
          <Ban size={18} />
          <span>{t('userBlockedMsg')}</span>
        </div>
      ) : chat.isReadOnly ? (
        <div className="z-10 bg-tg-sidebar px-4 py-3 flex items-center justify-center border-t border-tg-border/50">
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