
import React from 'react';
import { Check, CheckCheck, Mic, ShieldCheck, BadgeCheck } from 'lucide-react';
import { Chat } from '../types.ts';

interface ChatItemProps {
  chat: Chat;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="flex items-center px-4 py-2.5 hover:bg-tg-sidebar transition-all duration-200 cursor-pointer active:bg-tg-bg group relative"
    >
      {/* Avatar with Glowy Online Indicator */}
      <div className="relative flex-shrink-0">
        <div className={`w-[54px] h-[54px] rounded-full ${chat.user.avatarColor} flex items-center justify-center text-xl font-bold text-white shadow-md transform group-hover:scale-[1.03] transition-transform duration-300 overflow-hidden`}>
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
        {chat.user.status === 'online' && (
          <div className="absolute bottom-0 right-0 w-[15px] h-[15px] bg-tg-online border-[3.5px] border-tg-bg rounded-full shadow-[0_0_8px_rgba(77,217,100,0.5)]" />
        )}
      </div>

      {/* Content */}
      <div className="ml-4 flex-1 min-w-0 border-b border-tg-border/30 pb-2.5 group-last:border-none">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className="text-[16px] font-bold text-white truncate pr-2 group-hover:text-tg-accent transition-colors flex items-center">
            {chat.user.name}
            {chat.user.isAdmin ? (
               <ShieldCheck size={14} className="ml-1 text-amber-500" fill="currentColor" stroke="black" strokeWidth={1} />
            ) : chat.user.isOfficial ? (
               <BadgeCheck size={14} className="ml-1 text-blue-500" fill="#2AABEE" stroke="white" />
            ) : null}
          </h3>
          <span className="text-[12px] text-tg-secondary whitespace-nowrap font-medium opacity-80">
            {chat.lastMessage.timestamp}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1.5 min-w-0">
             {chat.lastMessage.type === 'voice' && <Mic size={14} className="text-tg-accent flex-shrink-0" />}
             <p className={`text-[14px] truncate leading-tight ${chat.unreadCount > 0 ? 'text-white/90 font-medium' : 'text-tg-secondary'}`}>
               {chat.lastMessage.text || (chat.lastMessage.type === 'voice' ? 'Голосовое сообщение' : '')}
             </p>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {chat.unreadCount > 0 ? (
              <div className="bg-tg-accent text-white text-[11px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg shadow-tg-accent/20 scale-100 group-hover:scale-110 transition-transform">
                {chat.unreadCount}
              </div>
            ) : (
              <div className="text-tg-accent/60 group-hover:text-tg-accent transition-colors">
                {chat.lastMessage.isRead ? <CheckCheck size={18} /> : <Check size={18} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatItem;