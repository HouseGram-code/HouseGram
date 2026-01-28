
import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Info, AtSign, Mail, 
  MessageCircle, Ban, Trash2, ShieldCheck, BadgeCheck, ShieldAlert, Bookmark, Star, Image, FileText, Link, Zap, User as UserIcon, Calendar, X, FlaskConical
} from 'lucide-react';
import { User, formatLastSeen, Gift } from '../types.ts';
import { useLanguage } from '../LanguageContext.tsx';

interface UserInfoScreenProps {
  user: User;
  isBlocked: boolean;
  onBack: () => void;
  onBlock: () => void;
  onDelete: () => void;
  currentUser: User; 
}

const UserInfoScreen: React.FC<UserInfoScreenProps> = ({ user, isBlocked, onBack, onBlock, onDelete, currentUser }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'gifts' | 'media' | 'files' | 'links'>('gifts');
  const [isScrolled, setIsScrolled] = useState(false);
  const [modal, setModal] = useState<'block' | 'delete' | null>(null);
  const [viewingGift, setViewingGift] = useState<Gift | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isSavedMessages = user.id === currentUser.id;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 50);
  };

  const confirmAction = () => {
    if (modal === 'block') onBlock();
    if (modal === 'delete') onDelete();
    setModal(null);
  };

  const renderStatus = () => {
    if (isSavedMessages) return t('cloudStorage'); 
    if (isBlocked) return t('offline');
    if (user.status === 'typing') return t('typing');
    return formatLastSeen(user, t, currentUser);
  };

  const getDisplayEmail = (email: string) => {
    if (user.id === 'me' || user.email === 'goh@gmail.com') return email;
    const atIndex = email.indexOf('@');
    if (atIndex < 0) return email;
    if (atIndex <= 2) return `***${email.slice(atIndex)}`;
    return `${email.slice(0, 2)}***${email.slice(atIndex)}`;
  };

  const statusText = renderStatus();
  const isOnline = statusText === t('online');

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
            <div className="flex flex-col space-y-2 mt-6">
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

      {/* VIEW GIFT DETAILS MODAL */}
      {viewingGift && (
          <div className="fixed inset-0 z-[110] flex flex-col bg-black/90 animate-fadeIn justify-center items-center p-4">
              <div className="bg-[#1c242f] w-full max-w-sm rounded-2xl border border-white/10 relative shadow-2xl animate-form-entrance overflow-hidden">
                  <div className="relative h-48 flex items-center justify-center bg-gradient-to-b from-[#2a2a2a] to-[#1c242f]">
                      <div className="absolute inset-0 opacity-30" style={{ backgroundColor: viewingGift.backgroundColor }} />
                      <div className="w-32 h-32 relative z-10 animate-plane-float filter drop-shadow-2xl">
                          <img src={viewingGift.imageUrl} alt="Gift" className="w-full h-full object-contain" />
                      </div>
                      <button onClick={() => setViewingGift(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors z-20">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-6">
                      <h2 className="text-white font-bold text-2xl text-center mb-1">{viewingGift.name}</h2>
                      {viewingGift.comment && (
                          <p className="text-tg-secondary text-sm text-center italic mb-6">"{viewingGift.comment}"</p>
                      )}
                      
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                              <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-tg-accent/20 flex items-center justify-center text-tg-accent">
                                      <UserIcon size={20} />
                                  </div>
                                  <div>
                                      <p className="text-xs text-tg-secondary uppercase font-bold">From</p>
                                      <p className="text-white font-medium">
                                          {viewingGift.isAnonymous ? "Anonymous" : (viewingGift.fromUserName || "Unknown User")}
                                      </p>
                                  </div>
                              </div>
                          </div>

                          {viewingGift.timestamp && (
                              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                  <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                          <Calendar size={20} />
                                      </div>
                                      <div>
                                          <p className="text-xs text-tg-secondary uppercase font-bold">Date</p>
                                          <p className="text-white font-medium">
                                              {new Date(viewingGift.timestamp).toLocaleDateString()} at {new Date(viewingGift.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          )}

                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                              <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                      <Zap size={20} className="fill-current" />
                                  </div>
                                  <div>
                                      <p className="text-xs text-tg-secondary uppercase font-bold">Value</p>
                                      <p className="text-white font-medium">{viewingGift.price} Zippers</p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <button 
                        onClick={() => setViewingGift(null)}
                        className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Dynamic Header */}
      <div className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pb-2 pt-safe transition-all duration-300 min-h-[60px] h-auto ${isScrolled ? 'bg-tg-sidebar shadow-lg border-b border-black/5 dark:border-white/5' : 'bg-transparent'}`}>
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-90">
            <ArrowLeft size={24} />
          </button>
          <div className={`flex flex-col transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-white font-bold text-[17px] flex items-center">
              {isSavedMessages ? t('saved') : user.name}
            </span>
            <span className={`${isOnline ? 'text-tg-online' : 'text-tg-secondary'} text-[12px]`}>
              {statusText}
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
        <div className="relative pt-24 pb-8 flex flex-col items-center bg-tg-sidebar shadow-md">
           <div className="relative group">
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-5xl font-bold text-white shadow-2xl overflow-hidden border-4 border-[#1c2733] transform transition-transform group-hover:scale-[1.02] ${!user.avatarUrl ? (isSavedMessages ? 'bg-tg-accent' : user.avatarColor) : ''}`}>
              {isSavedMessages ? (
                 <Bookmark size={60} className="text-white" fill="white" />
              ) : user.avatarUrl ? (
                 user.isVideoAvatar ? (
                    <video src={user.avatarUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                 ) : (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                 )
              ) : (
                user.name.charAt(0)
              )}
            </div>
            {!isSavedMessages && !isBlocked && isOnline && (
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-tg-online border-4 border-tg-sidebar rounded-full shadow-lg" />
            )}
          </div>
          <div className="mt-4 text-center px-6">
            <h2 className="text-white text-2xl font-black tracking-tight flex items-center justify-center">
                {isSavedMessages ? t('saved') : user.name}
                {!isSavedMessages && user.isAdmin && (
                    <div className="ml-2 bg-amber-500/10 border border-amber-500/20 rounded-full p-1" title="Administrator">
                         <ShieldCheck size={20} className="text-amber-500" />
                    </div>
                )}
                {!isSavedMessages && user.isTester && (
                    <div className="ml-2 bg-purple-500/10 border border-purple-500/20 rounded-full p-1" title="Beta Tester">
                         <FlaskConical size={20} className="text-purple-500" />
                    </div>
                )}
            </h2>
            <p className={`font-medium mt-1 ${isOnline ? 'text-tg-online' : 'text-tg-secondary'}`}>
              {statusText}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center px-4 w-full">
            <ActionButton icon={<MessageCircle size={28} />} onClick={onBack} color="text-tg-accent" />
          </div>
        </div>

        {/* Info Items Section */}
        <div className="mt-4 bg-tg-sidebar border-y border-black/5 dark:border-white/5 space-y-0.5">
           {!isSavedMessages && user.email && !user.isOfficial && (
             <InfoItem 
               icon={<Mail size={22} className="text-tg-accent" />} 
               value={getDisplayEmail(user.email)} 
               label={t('email')} 
             />
           )}
          {!isSavedMessages && user.username && (
            <InfoItem 
              icon={<AtSign size={22} className="text-tg-accent" />} 
              value={`@${user.username.replace('@', '')}`} 
              label={t('username')} 
            />
          )}
          {!isSavedMessages && user.bio && (
            <InfoItem 
              icon={<Info size={22} className="text-tg-accent" />} 
              value={user.bio} 
              label={t('bio')} 
            />
          )}
        </div>

        {/* TABS SECTION (Gifts, Media, etc) */}
        {!isSavedMessages && (
            <div className="mt-4 bg-tg-sidebar border-y border-black/5 dark:border-white/5 min-h-[300px]">
                {/* Tabs Header */}
                <div className="flex border-b border-black/5 dark:border-white/5">
                    <TabButton active={activeTab === 'gifts'} label="Gifts" icon={<Star size={16} />} onClick={() => setActiveTab('gifts')} />
                    <TabButton active={activeTab === 'media'} label="Media" icon={<Image size={16} />} onClick={() => setActiveTab('media')} />
                    <TabButton active={activeTab === 'files'} label="Files" icon={<FileText size={16} />} onClick={() => setActiveTab('files')} />
                    <TabButton active={activeTab === 'links'} label="Links" icon={<Link size={16} />} onClick={() => setActiveTab('links')} />
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {activeTab === 'gifts' && (
                        <div className="grid grid-cols-3 gap-3">
                            {user.gifts && user.gifts.length > 0 ? (
                                user.gifts.map((gift, idx) => (
                                    <div 
                                        key={`${gift.id}-${idx}`} 
                                        onClick={() => setViewingGift(gift)}
                                        className="bg-black/5 dark:bg-[#242f3d] rounded-xl p-2 flex flex-col items-center relative overflow-hidden group shadow-lg cursor-pointer hover:bg-black/10 dark:hover:bg-[#2b3849] transition-all hover:scale-105 active:scale-95"
                                    >
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: gift.backgroundColor }} />
                                        <img src={gift.imageUrl} className="w-12 h-12 object-contain relative z-10 mb-1" alt={gift.name} />
                                        <div className="flex items-center space-x-1 bg-black/20 rounded-full px-2 py-0.5 relative z-10">
                                            <span className="text-[10px] text-amber-400 font-bold">{gift.price}</span>
                                            <Star size={8} className="text-amber-400 fill-amber-400" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-3 py-8 flex flex-col items-center justify-center text-center opacity-50 space-y-2">
                                    <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center">
                                        <Star size={32} className="text-tg-secondary" />
                                    </div>
                                    <p className="text-tg-secondary text-sm">No gifts yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab !== 'gifts' && (
                        <div className="py-10 text-center opacity-40">
                            <p className="text-sm text-tg-secondary">No items found</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Action List */}
        {!isSavedMessages && !user.isOfficial && !user.isAdmin && (
            <div className="mt-4 bg-tg-sidebar border-y border-black/5 dark:border-white/5">
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
        
        <div className="h-20" />
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; label: string; icon: React.ReactNode; onClick: () => void }> = ({ active, label, icon, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-3 flex flex-col items-center justify-center space-y-1 relative transition-colors ${active ? 'text-tg-accent' : 'text-tg-secondary hover:text-tg-text'}`}
    >
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        {active && <div className="absolute bottom-0 w-full h-[2px] bg-tg-accent" />}
    </button>
);

const ActionButton: React.FC<{ icon: React.ReactNode; label?: string; onClick?: () => void; color?: string }> = ({ icon, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all ${color || 'text-white'}`}
  >
    {icon}
  </button>
);

const InfoItem: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="px-5 py-4 flex items-center space-x-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
    <div className="flex-shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
    <div className="flex-1 flex flex-col min-w-0">
      <span className="text-tg-text text-[16px] font-medium truncate">{value}</span>
      <span className="text--[12px] text-tg-secondary font-bold uppercase tracking-wider">{label}</span>
    </div>
  </div>
);

const SettingsLink: React.FC<{ icon: React.ReactNode; label: string; color?: string; onClick?: () => void }> = ({ icon, label, color, onClick }) => (
  <div 
    onClick={onClick}
    className="px-5 py-4 flex items-center space-x-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
  >
    <div className="flex-shrink-0">{icon}</div>
    <div className="flex-1 border-b border-black/5 dark:border-white/5 pb-4 group-last:border-none">
       <span className={`${color || 'text-tg-text'} text-[16px] font-medium`}>{label}</span>
    </div>
  </div>
);

export default UserInfoScreen;
