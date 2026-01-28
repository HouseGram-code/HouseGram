
import React, { useState, useEffect } from 'react';
import { Check, CheckCheck, Mic, ShieldCheck, BadgeCheck, Bookmark, FlaskConical } from 'lucide-react';
import { Chat, isUserOnline, User } from '../types.ts';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { useLanguage } from '../LanguageContext.tsx';

interface ChatItemProps {
  chat: Chat;
  onClick: () => void;
  currentUser?: User; // Added prop
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, onClick, currentUser }) => {
  const { t } = useLanguage();
  // Use local state to track the live user object, initialized with the passed prop
  const [liveUser, setLiveUser] = useState<User>(chat.user);
  const [isTyping, setIsTyping] = useState(false);

  const isSavedMessages = currentUser && chat.id === `saved_${currentUser.id}`;

  // Subscribe to the specific user's document to get real-time status/heartbeat updates
  useEffect(() => {
    if (!chat.user.id || chat.user.id === 'news-bot' || isSavedMessages) return;

    const userRef = doc(db, "users", chat.user.id);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            setLiveUser({ ...docSnap.data(), id: docSnap.id } as User);
        }
    });

    return () => unsubscribe();
  }, [chat.user.id, isSavedMessages]);

  // Check typing status from chat prop (which comes from Firestore)
  useEffect(() => {
      if (chat.typing && !isSavedMessages && chat.user.id) {
          const typingTime = chat.typing[chat.user.id];
          if (typingTime && Date.now() - typingTime < 4000) {
              setIsTyping(true);
              return;
          }
      }
      setIsTyping(false);
  }, [chat.typing, chat.user.id, isSavedMessages]);

  const isOnline = !isSavedMessages && isUserOnline(liveUser, currentUser);

  return (
    <div 
      onClick={onClick}
      className="flex items-center px-4 py-2.5 hover:bg-tg-sidebar transition-all duration-200 cursor-pointer active:bg-tg-bg group relative"
    >
      {/* Avatar with Glowy Online Indicator */}
      <div className="relative flex-shrink-0">
        {isSavedMessages ? (
            <div className="w-[54px] h-[54px] rounded-full bg-tg-accent flex items-center justify-center shadow-md transform group-hover:scale-[1.03] transition-transform duration-300">
                <Bookmark size={28} className="text-white" fill="white" />
            </div>
        ) : (
            <div className={`w-[54px] h-[54px] rounded-full ${liveUser.avatarColor} flex items-center justify-center text-xl font-bold text-white shadow-md transform group-hover:scale-[1.03] transition-transform duration-300 overflow-hidden`}>
            {liveUser.avatarUrl ? (
                liveUser.isVideoAvatar ? (
                    <video src={liveUser.avatarUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                    <img src={liveUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                )
            ) : (
                liveUser.name.charAt(0)
            )}
            </div>
        )}
        
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-[15px] h-[15px] bg-tg-online border-[3.5px] border-tg-bg rounded-full shadow-[0_0_8px_rgba(77,217,100,0.5)]" />
        )}
      </div>

      {/* Content */}
      <div className="ml-4 flex-1 min-w-0 border-b border-black/5 dark:border-white/5 pb-2.5 group-last:border-none">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className="text-[16px] font-bold text-white truncate pr-2 group-hover:text-tg-accent transition-colors flex items-center">
            {isSavedMessages ? t('saved') : liveUser.name}
            {!isSavedMessages && (
                <>
                    {liveUser.isAdmin ? (
                    <ShieldCheck size={14} className="ml-1 text-amber-500" fill="currentColor" stroke="black" strokeWidth={1} />
                    ) : liveUser.isOfficial ? (
                    <BadgeCheck size={14} className="ml-1 text-blue-500" fill="#2AABEE" stroke="white" />
                    ) : null}
                    {liveUser.isTester && (
                      <FlaskConical size={14} className="ml-1 text-purple-400" strokeWidth={2.5} />
                    )}
                </>
            )}
          </h3>
          <span className={`text-[12px] whitespace-nowrap font-medium opacity-80 ${isTyping ? 'text-tg-accent animate-pulse' : 'text-tg-secondary'}`}>
             {isTyping ? '...' : chat.lastMessage.timestamp}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1.5 min-w-0">
             {isTyping ? (
                 <p className="text-[14px] text-tg-accent font-medium leading-tight animate-pulse flex items-center">
                    typing
                    <span className="flex space-x-0.5 items-end ml-1 mb-0.5">
                       <span className="w-1 h-1 bg-tg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-1 h-1 bg-tg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-1 h-1 bg-tg-accent rounded-full animate-bounce"></span>
                    </span>
                 </p>
             ) : (
                 <>
                    {chat.lastMessage.type === 'voice' && <Mic size={14} className="text-tg-accent flex-shrink-0" />}
                    <p className={`text-[14px] truncate leading-tight ${chat.unreadCount > 0 ? 'text-white/90 font-medium' : 'text-tg-secondary'}`}>
                    {chat.lastMessage.text || (chat.lastMessage.type === 'voice' ? 'Voice Message' : '')}
                    </p>
                 </>
             )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {chat.unreadCount > 0 ? (
              <div className="bg-tg-accent text-white text-[11px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg shadow-tg-accent/20 scale-100 group-hover:scale-110 transition-transform">
                {chat.unreadCount}
              </div>
            ) : (
              !isTyping && (
                  <div className="text-tg-accent/60 group-hover:text-tg-accent transition-colors">
                    {chat.lastMessage.isRead ? <CheckCheck size={18} /> : <Check size={18} />}
                  </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatItem;