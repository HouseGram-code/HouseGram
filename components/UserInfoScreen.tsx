
import React, { useState } from 'react';
import { ArrowLeft, Info, AtSign, Mail, MessageCircle, Ban, Trash2, BadgeCheck, BellOff, Gift as GiftIcon, Star, Image, FileText, Zap } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'gifts' | 'media' | 'files'>('gifts');
  const [isScrolled, setIsScrolled] = useState(false);

  const statusText = formatLastSeen(user, t, currentUser);
  const isOnline = statusText === t('online');

  return (
    <div className="flex flex-col h-full w-full bg-tg-bg overflow-hidden animate-fadeIn relative">
      <div className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pb-2 pt-safe transition-all duration-300 min-h-[60px] ${isScrolled ? 'bg-tg-sidebar shadow-lg' : 'bg-transparent'}`}>
        <button onClick={onBack} className="p-2 text-white bg-black/20 rounded-full hover:bg-black/40 transition-colors"><ArrowLeft size={24} /></button>
        <div className={`flex flex-col items-center transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-white font-bold">{user.name}</span>
            <span className="text-tg-secondary text-[11px]">{statusText}</span>
        </div>
        <div className="w-10" />
      </div>

      <div onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 50)} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <div className="relative pt-20 pb-8 flex flex-col items-center bg-tg-sidebar shadow-md">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold text-white shadow-2xl border-4 border-[#1c2733] overflow-hidden ${user.avatarColor}`}>
                {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <h2 className="text-white text-2xl font-black mt-4 flex items-center tracking-tight">
                {user.name} {user.isOfficial && <BadgeCheck size={24} className="ml-2 text-tg-accent" fill="currentColor" stroke="white"/>}
            </h2>
            <p className={`font-medium mt-1 ${isOnline ? 'text-tg-online' : 'text-tg-secondary'}`}>{statusText}</p>

            {/* Icons row with calls removed */}
            <div className="mt-8 flex items-center justify-center space-x-12 w-full px-4">
                <ActionBtn icon={<MessageCircle size={28} />} label="Message" onClick={onBack} color="text-tg-accent" />
                <ActionBtn icon={<Zap size={28} className="text-amber-400 fill-amber-400" />} label="Zippers" color="text-amber-400" />
                <ActionBtn icon={<BellOff size={28} />} label="Mute" color="text-tg-secondary" />
            </div>
        </div>

        <div className="mt-4 bg-tg-sidebar border-y border-white/5">
            {user.username && <InfoLine icon={<AtSign size={20} className="text-tg-accent"/>} label="Username" value={`@${user.username.replace('@', '')}`} />}
            {user.bio && <InfoLine icon={<Info size={20} className="text-tg-accent"/>} label="Bio" value={user.bio} />}
            {user.email && <InfoLine icon={<Mail size={20} className="text-tg-accent"/>} label="Email" value={user.email} />}
            <InfoLine icon={<Zap size={20} className="text-amber-400 fill-amber-400"/>} label="Zippers Balance" value={`${user.zippers || 0} Zippers`} />
        </div>

        <div className="mt-4 bg-tg-sidebar border-y border-white/5 min-h-[350px]">
            <div className="flex border-b border-white/5">
                <TabBtn active={activeTab === 'gifts'} label="Gifts" icon={<GiftIcon size={16}/>} onClick={() => setActiveTab('gifts')} />
                <TabBtn active={activeTab === 'media'} label="Media" icon={<Image size={16}/>} onClick={() => setActiveTab('media')} />
                <TabBtn active={activeTab === 'files'} label="Files" icon={<FileText size={16}/>} onClick={() => setActiveTab('files')} />
            </div>
            <div className="p-4">
                {activeTab === 'gifts' && (
                    <div className="grid grid-cols-3 gap-3">
                        {user.gifts && user.gifts.length > 0 ? user.gifts.map((g, i) => (
                            <div key={i} className="bg-white/5 rounded-2xl p-4 flex flex-col items-center shadow-lg relative overflow-hidden group hover:scale-105 transition-transform">
                                <div className="absolute inset-0 opacity-10" style={{backgroundColor: g.backgroundColor}} />
                                <img src={g.imageUrl} className="w-14 h-14 object-contain mb-2 relative z-10" alt={g.name} />
                                <div className="flex items-center space-x-1 text-amber-400 text-[10px] font-bold bg-black/20 px-2 py-0.5 rounded-full relative z-10">
                                    <span>{g.price}</span><Star size={8} fill="currentColor"/>
                                </div>
                                {g.fromUserName && <span className="text-[10px] text-tg-secondary mt-1 relative z-10 truncate w-full text-center">From: {g.fromUserName}</span>}
                            </div>
                        )) : (
                            <div className="col-span-3 text-center py-16 opacity-30 flex flex-col items-center">
                                <GiftIcon size={48} className="mb-4"/>
                                <p className="font-bold text-lg">No gifts received yet</p>
                            </div>
                        )}
                    </div>
                )}
                {activeTab !== 'gifts' && <div className="py-20 text-center opacity-30 text-lg font-bold">No items found</div>}
            </div>
        </div>

        <div className="mt-4 bg-tg-sidebar border-y border-white/5 mb-20">
            <button onClick={onBlock} className="w-full px-5 py-4 flex items-center space-x-5 text-red-500 hover:bg-red-500/10 transition-colors"><Ban size={22}/><span className="font-medium">{isBlocked ? 'Unblock' : 'Block User'}</span></button>
            <button onClick={onDelete} className="w-full px-5 py-4 flex items-center space-x-5 text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={22}/><span className="font-medium">Delete Contact</span></button>
        </div>
      </div>
    </div>
  );
};

const ActionBtn = ({ icon, label, onClick, color }: any) => (
    <button onClick={onClick} className="flex flex-col items-center space-y-2 group">
        <div className={`w-14 h-14 rounded-full bg-white/5 flex items-center justify-center transition-all group-hover:bg-white/10 group-active:scale-90 ${color}`}>{icon}</div>
        <span className="text-[11px] text-tg-secondary font-bold uppercase tracking-wide group-hover:text-white transition-colors">{label}</span>
    </button>
);

const InfoLine = ({ icon, label, value }: any) => (
    <div className="px-5 py-4 flex items-center space-x-6 hover:bg-white/5 transition-colors group">
        <div className="shrink-0 transition-transform group-hover:scale-110">{icon}</div>
        <div className="flex flex-col"><span className="text-white text-[16px] font-medium">{value}</span><span className="text-[11px] text-tg-secondary font-bold uppercase tracking-wider">{label}</span></div>
    </div>
);

const TabBtn = ({ active, label, icon, onClick }: any) => (
    <button onClick={onClick} className={`flex-1 py-3.5 flex flex-col items-center space-y-1 relative transition-all ${active ? 'text-tg-accent' : 'text-tg-secondary hover:text-white'}`}>
        {icon}<span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        {active && <div className="absolute bottom-0 w-10 h-[3px] bg-tg-accent rounded-t-full shadow-[0_0_10px_rgba(42,171,238,0.5)]" />}
    </button>
);

export default UserInfoScreen;
