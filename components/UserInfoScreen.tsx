import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Info, AtSign, Mail, 
  MessageCircle, Ban, Trash2, ShieldCheck, BadgeCheck, ShieldAlert
} from 'lucide-react';
import { User } from '../types.ts';
import { useLanguage } from '../LanguageContext.tsx';
import { ME } from '../constants.ts';

interface UserInfoScreenProps {
  user: User;
  isBlocked: boolean;
  onBack: () => void;
  onBlock: () => void;
  onDelete: () => void;
}

const UserInfoScreen: React.FC<UserInfoScreenProps> = ({ user, isBlocked, onBack, onBlock, onDelete }) => {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [modal, setModal] = useState<'block' | 'delete' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 50);
  };

  const confirmAction = () => {
    if (modal === 'block') onBlock();
    if (modal === 'delete') onDelete();
    setModal(null);
  };

  const renderStatus = () => {
    if (isBlocked) return t('offline');
    if (user.status === 'typing') return t('typing');
    if (user.status === 'online') return t('online');
    return `${t('lastSeenAt')} ${user.lastSeen || '12:00'}`;
  };

  // Function to mask email
  const getDisplayEmail = (email: string) => {
    if (user.id === 'me' || user.email === 'goh@gmail.com') return email;
    
    // Simple mask: first 2 chars + *** + domain
    const atIndex = email.indexOf('@');
    if (atIndex < 0) return email;
    if (atIndex <= 2) return `***${email.slice(atIndex)}`;
    return `${email.slice(0, 2)}***${email.slice(atIndex)}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-tg-bg overflow-hidden animate-fadeIn relative">
      {/* Confirmation Modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 animate-fadeIn">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-xs bg-tg-sidebar border border-white/10 rounded-2xl p-6 shadow-2xl animate-form-entrance">
            <h3 className="text-white text-lg font-bold mb-2">
              {modal === 'block' ? (isBlocked ? t('unblockUser') : t('confirmBlockTitle')) : t('confirmDeleteTitle')}
            </h3>
            <p className="text-tg-secondary text-sm mb-6 leading-relaxed">
              {modal === 'block' ? (isBlocked ? `Are you sure you want to unblock ${user.name}?` : t('confirmBlockDesc')) : t('confirmDeleteDesc')}
            </p>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={confirmAction}
                className={`w-full py-3 rounded-xl font-bold transition-all ${modal === 'delete' || (modal === 'block' && !isBlocked) ? 'bg-red-500 text-white' : 'bg-tg-accent text-white'}`}
              >
                {modal === 'block' ? (isBlocked ? t('unblockUser') : t('blockUser')) : t('deleteContact')}
              </button>
              <button 
                onClick={() => setModal(null)}
                className="w-full py-3 text-tg-secondary font-medium hover:text-white transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Header */}
      <div className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2 transition-all duration-300 ${isScrolled ? 'bg-tg-sidebar shadow-lg border-b border-tg-border' : 'bg-transparent'}`}>
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-90">
            <ArrowLeft size={24} />
          </button>
          <div className={`flex flex-col transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-white font-bold text-[17px] flex items-center">
              {user.name}
              {user.isAdmin ? (
                <ShieldCheck size={14} className="ml-1 text-amber-500" fill="currentColor" stroke="black" strokeWidth={1} />
              ) : user.isOfficial ? (
                <BadgeCheck size={14} className="ml-1 text-blue-500" fill="#2AABEE" stroke="white" />
              ) : null}
            </span>
            <span className="text-tg-accent text-[12px]">
              {renderStatus()}
            </span>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef} 
        onScroll={handleScroll} 
        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth"
      >
        {/* Profile Header Block */}
        <div className="relative pt-16 pb-8 flex flex-col items-center bg-tg-sidebar shadow-md">
           <div className="relative group">
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-5xl font-bold text-white shadow-2xl overflow-hidden border-4 border-[#1c2733] transform transition-transform group-hover:scale-[1.02] ${!user.avatarUrl ? user.avatarColor : ''}`}>
              {user.avatarUrl ? (
                 user.isVideoAvatar ? (
                    <video src={user.avatarUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                 ) : (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                 )
              ) : (
                user.name.charAt(0)
              )}
            </div>
            {!isBlocked && user.status === 'online' && (
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-tg-online border-4 border-tg-sidebar rounded-full shadow-lg" />
            )}
            {isBlocked && (
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-red-500 border-4 border-tg-sidebar rounded-full shadow-lg flex items-center justify-center">
                <Ban size={14} className="text-white" />
              </div>
            )}
          </div>
          <div className="mt-4 text-center px-6">
            <h2 className="text-white text-2xl font-black tracking-tight flex items-center justify-center">
                {user.name}
                {user.isAdmin && (
                    <div className="ml-2 bg-amber-500/10 border border-amber-500/20 rounded-full p-1" title="Administrator">
                         <ShieldCheck size={20} className="text-amber-500" />
                    </div>
                )}
            </h2>
            <p className={`font-medium mt-1 ${user.status === 'typing' ? 'text-tg-accent animate-pulse' : 'text-tg-secondary'}`}>
              {renderStatus()}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center px-4 w-full">
            <ActionButton icon={<MessageCircle size={28} />} onClick={onBack} color="text-tg-accent" />
          </div>
        </div>

        {/* Info Items Section */}
        <div className="mt-4 bg-tg-sidebar border-y border-tg-border space-y-0.5">
           {/* Admin Badge Info Row */}
           {user.isAdmin && (
             <div className="px-5 py-4 flex items-center space-x-6 bg-amber-500/5">
                <div className="flex-shrink-0">
                    <ShieldAlert size={22} className="text-amber-500" />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-amber-500 text-[16px] font-bold">Administrator</span>
                    <span className="text-[12px] text-tg-secondary font-bold uppercase tracking-wider">Role</span>
                </div>
             </div>
           )}

           {user.email && (
             <InfoItem 
               icon={<Mail size={22} className="text-tg-accent" />} 
               value={getDisplayEmail(user.email)} 
               label={t('email')} 
             />
           )}
          {user.username && (
            <InfoItem 
              icon={<AtSign size={22} className="text-tg-accent" />} 
              value={`@${user.username.replace('@', '')}`} 
              label={t('username')} 
            />
          )}
          {user.bio && (
            <InfoItem 
              icon={<Info size={22} className="text-tg-accent" />} 
              value={user.bio} 
              label={t('bio')} 
            />
          )}
        </div>

        {/* Action List - Hidden for Official/Admin Accounts */}
        {!user.isOfficial && !user.isAdmin && (
            <div className="mt-4 bg-tg-sidebar border-y border-tg-border">
            <SettingsLink 
                icon={<Ban size={22} className={isBlocked ? "text-tg-accent" : "text-red-500"} />} 
                label={isBlocked ? t('unblockUser') : t('blockUser')} 
                color={isBlocked ? "text-tg-accent" : "text-red-500"} 
                onClick={() => setModal('block')}
            />
            <SettingsLink 
                icon={<Trash2 size={22} className="text-red-500" />} 
                label={t('deleteContact')} 
                color="text-red-500" 
                onClick={() => setModal('delete')}
            />
            </div>
        )}
        
        <div className="mt-8 px-6 flex items-center justify-center space-x-2 text-tg-secondary/30">
           <ShieldCheck size={14} />
           <span className="text-[11px] font-medium tracking-widest uppercase">Encryption Enabled</span>
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label?: string; onClick?: () => void; color?: string }> = ({ icon, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all ${color || 'text-white'}`}
  >
    {icon}
  </button>
);

const InfoItem: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="px-5 py-4 flex items-center space-x-6 hover:bg-white/5 transition-colors cursor-pointer group">
    <div className="flex-shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
    <div className="flex-1 flex flex-col min-w-0">
      <span className="text-white text-[16px] font-medium truncate">{value}</span>
      <span className="text-[12px] text-tg-secondary font-bold uppercase tracking-wider">{label}</span>
    </div>
  </div>
);

const SettingsLink: React.FC<{ icon: React.ReactNode; label: string; color?: string; onClick?: () => void }> = ({ icon, label, color, onClick }) => (
  <div 
    onClick={onClick}
    className="px-5 py-4 flex items-center space-x-6 hover:bg-white/5 transition-colors cursor-pointer group"
  >
    <div className="flex-shrink-0">{icon}</div>
    <div className="flex-1 border-b border-tg-border/50 pb-4 group-last:border-none">
       <span className={`${color || 'text-white'} text-[16px] font-medium`}>{label}</span>
    </div>
  </div>
);

export default UserInfoScreen;