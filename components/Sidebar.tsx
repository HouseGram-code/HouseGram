
import React from 'react';
import { 
  User as UserIcon, Users, Megaphone, Search, Bookmark, 
  Settings, UserPlus, Lock, PhoneCall, ShieldAlert
} from 'lucide-react';
import { User } from '../types.ts';
import { useLanguage } from '../LanguageContext.tsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenAdmin?: () => void;
  currentUser: User;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenProfile, onOpenAdmin, currentUser }) => {
  const { t } = useLanguage();
  
  // Secret Check: Only show if email matches goh@gmail.com
  const isAdmin = currentUser.email?.toLowerCase() === 'goh@gmail.com';

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 z-40 backdrop-blur-[1px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed inset-y-0 left-0 w-[280px] bg-tg-sidebar z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-tg-border shadow-2xl flex flex-col h-full`}>
        <div onClick={onOpenProfile} className="relative h-44 bg-[#1c242f] overflow-hidden p-5 flex flex-col justify-end cursor-pointer group hover:bg-[#232c3a] transition-colors shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-tg-accent/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10 space-y-3">
            <div className="relative inline-block">
              {currentUser.avatarUrl ? (
                currentUser.isVideoAvatar ? (
                   <video src={currentUser.avatarUrl} autoPlay loop muted playsInline className="w-16 h-16 rounded-full object-cover border-2 border-white/5 shadow-lg" />
                ) : (
                   <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-16 h-16 rounded-full object-cover border-2 border-white/5 shadow-lg" />
                )
              ) : (
                <div className={`w-16 h-16 rounded-full ${currentUser.avatarColor} border-2 border-white/5 flex items-center justify-center text-2xl font-bold text-white shadow-lg`}>{currentUser.name.charAt(0)}</div>
              )}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-tg-online border-[3px] border-[#1c242f] rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-[17px] leading-tight group-hover:text-tg-accent transition-colors">{currentUser.name}</span>
              <span className="text-tg-secondary text-sm font-medium">{currentUser.email || currentUser.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-2 pb-safe">
          <MenuItem icon={<UserIcon size={22} />} label={t('myProfile')} onClick={onOpenProfile} />
          
          {/* Secret Admin Button */}
          {isAdmin && onOpenAdmin && (
             <MenuItem 
                icon={<ShieldAlert size={22} className="text-red-500" />} 
                label="Admin Panel" 
                onClick={onOpenAdmin}
                badge={<Badge text="GOD MODE" color="text-red-500 border-red-500/30 bg-red-500/10" />}
             />
          )}

          <div className="mx-4 my-2 border-b border-tg-border/50" />
          <MenuItem icon={<Users size={22} />} label={t('createGroup')} badge={<Badge text={t('soon')} />} />
          <MenuItem icon={<Megaphone size={22} />} label={t('createChannel')} badge={<Badge text={t('soon')} />} />
          <MenuItem icon={<UserIcon size={22} />} label={t('contacts')} badge={<Badge text={t('soon')} locked />} />
          <MenuItem icon={<PhoneCall size={22} />} label={t('calls')} badge={<Badge text={t('soon')} locked />} />
          <MenuItem icon={<Bookmark size={22} />} label={t('saved')} badge={<Badge text={t('soon')} />} />
          <MenuItem icon={<Settings size={22} />} label={t('settings')} onClick={onOpenProfile} />
          <div className="mx-4 my-2 border-b border-tg-border/50" />
          <MenuItem icon={<UserPlus size={22} />} label={t('invite')} badge={<Badge text={t('soon')} />} />
        </div>
      </div>
    </>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; badge?: React.ReactNode; onClick?: () => void }> = ({ icon, label, badge, onClick }) => (
  <div onClick={onClick} className="flex items-center px-4 py-3 space-x-6 hover:bg-white/5 cursor-pointer transition-all group">
    <div className="text-tg-secondary group-hover:text-tg-accent transition-colors duration-200">{icon}</div>
    <div className="flex-1 flex justify-between items-center min-w-0">
      <span className="text-white/90 font-medium truncate pr-2 group-hover:text-white">{label}</span>
      {badge}
    </div>
  </div>
);

const Badge: React.FC<{ text: string; locked?: boolean; color?: string }> = ({ text, locked, color }) => (
  <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-[4px] border shadow-[0_2px_8px_rgba(42,171,238,0.1)] transition-transform group-hover:scale-105 ${color || 'bg-tg-accent/10 border-tg-accent/20 text-tg-accent'}`}>
    {locked && <Lock size={10} className="opacity-70" />}
    <span className="tracking-wide text-[10px] font-bold">{text}</span>
  </div>
);

export default Sidebar;
