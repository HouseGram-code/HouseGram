
import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Camera, Check, Info, AtSign, Mail, Edit2, 
  Bell, Lock, Shield, Globe, HelpCircle, LogOut, Play, BookOpen, BadgeCheck, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { User, Language } from '../types.ts';
import { useLanguage } from '../LanguageContext.tsx';

interface ProfileScreenProps {
  user: User;
  onBack: () => void;
  onUpdate: (updatedUser: User) => void;
  onLogout: () => void;
  onOpenFeatures: () => void;
  onOpenPrivacy: () => void;
  onOpenFAQ: () => void;
  onOpenNotifications: () => void;
  onOpenGuide: () => void;
  onOpenDataStorage: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  user, onBack, onUpdate, onLogout, onOpenFeatures, onOpenPrivacy, onOpenFAQ, onOpenNotifications, onOpenGuide, onOpenDataStorage
}) => {
  const { t, setLanguage, language } = useLanguage();
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [email, setEmail] = useState(user.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [isVideo, setIsVideo] = useState(user.isVideoAvatar || false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fallback check for admin if props haven't updated yet
  const isAdmin = user.isAdmin || (user.email && user.email.toLowerCase() === 'goh@gmail.com');

  const handleSave = () => {
    onUpdate({ ...user, name, username, bio, email, avatarUrl, isVideoAvatar: isVideo });
    onBack();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 5) {
            alert("Video avatar must be 5 seconds or less.");
            return;
          }
          processFile(file, true);
        };
        video.src = URL.createObjectURL(file);
      } else {
        processFile(file, false);
      }
    }
  };

  const processFile = (file: File, isVideoFile: boolean) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setIsVideo(isVideoFile);
    };
    reader.readAsDataURL(file);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 10);
  };

  const LANGUAGES: { id: Language; name: string }[] = [
    { id: 'ru', name: 'Русский' },
    { id: 'en', name: 'English' },
    { id: 'es', name: 'Español' },
    { id: 'fr', name: 'Français' },
    { id: 'de', name: 'Deutsch' },
    { id: 'tr', name: 'Türkçe' },
    { id: 'it', name: 'Italiano' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-tg-bg overflow-hidden animate-fadeIn relative">
      <div className={`z-20 bg-tg-sidebar px-4 pb-2 pt-safe flex items-center justify-between border-b transition-all duration-300 min-h-[60px] h-auto ${isScrolled ? 'border-tg-border shadow-lg' : 'border-transparent'}`}>
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full transition-colors active:scale-90">
            <ArrowLeft size={24} />
          </button>
          <span className={`text-white font-bold text-xl transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>{t('profile')}</span>
          {!isScrolled && <span className="text-white font-bold text-xl">{t('settings')}</span>}
        </div>
        <button onClick={handleSave} className="p-2 text-tg-accent hover:bg-tg-accent/10 rounded-full transition-colors active:scale-90">
          <Check size={24} strokeWidth={3} />
        </button>
      </div>

      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <div className="flex flex-col items-center py-8 bg-tg-sidebar relative shadow-inner">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl overflow-hidden border-4 border-[#17212B] transition-transform active:scale-95 ${!avatarUrl ? user.avatarColor : ''}`}>
              {avatarUrl ? (
                isVideo ? (
                  <video src={avatarUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                )
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={32} />
            </div>
            {isVideo && (
               <div className="absolute bottom-1 right-1 bg-black/60 rounded-full p-1.5 border border-white/20">
                  <Play size={10} className="text-white" fill="white" />
               </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/mp4,video/webm" />
          </div>
          
          <div className="mt-5 text-center w-full px-4 flex flex-col items-center">
            {/* Auto-width input container */}
            <div className="flex items-center justify-center gap-1.5">
                <div className="relative grid place-items-center max-w-[80%]">
                    {/* Invisible sizer */}
                    <span className="invisible text-2xl font-bold px-1 pb-1 whitespace-pre overflow-hidden text-ellipsis max-w-full">
                       {name || 'Name'}
                    </span>
                    {/* Input overlay */}
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="col-start-1 row-start-1 w-full bg-transparent text-white text-2xl font-bold text-center focus:outline-none border-b border-transparent focus:border-tg-accent/50 transition-all px-1 pb-1 placeholder-white/20 min-w-[10px]"
                      placeholder="Name"
                    />
                </div>
                 {isAdmin && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-full p-1 flex-shrink-0 animate-fadeIn" title="Administrator">
                         <ShieldCheck size={16} className="text-amber-500" />
                    </div>
                )}
            </div>
            <p className="text-tg-accent text-sm font-medium mt-1">{t('online')}</p>
          </div>
        </div>

        <div className="mt-4 bg-tg-sidebar border-y border-tg-border">
          <div className="px-5 py-2 text-xs font-bold text-tg-accent uppercase tracking-widest bg-tg-bg/30">{t('account')}</div>
          
           {isAdmin && (
             <div className="px-5 py-4 flex items-center space-x-6 bg-amber-500/5 border-b border-tg-border/50 animate-fadeIn">
                <div className="flex-shrink-0">
                    <ShieldAlert size={22} className="text-amber-500" />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-amber-500 text-[16px] font-bold">Administrator</span>
                    <span className="text-[12px] text-tg-secondary font-bold uppercase tracking-wider">Role</span>
                </div>
             </div>
           )}

          <div className="px-5 py-4 flex items-center space-x-6 hover:bg-white/5 cursor-pointer transition-colors group">
            <Mail size={22} className="text-tg-secondary group-hover:text-tg-accent transition-colors" />
            <div className="flex-1 border-b border-tg-border/50 pb-4 group-last:border-none">
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-transparent text-white focus:outline-none text-[16px]" />
              <p className="text-[12px] text-tg-secondary">{t('email')}</p>
            </div>
          </div>

          <div className="px-5 py-4 flex items-center space-x-6 hover:bg-white/5 cursor-pointer transition-colors group">
            <AtSign size={22} className="text-tg-secondary group-hover:text-tg-accent transition-colors" />
            <div className="flex-1 border-b border-tg-border/50 pb-4 group-last:border-none">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" className="w-full bg-transparent text-white focus:outline-none text-[16px]" />
              <p className="text-[12px] text-tg-secondary">{t('username')}</p>
            </div>
          </div>
          
          <div className="px-5 py-4 flex items-center space-x-6 hover:bg-white/5 cursor-pointer transition-colors group">
            <Info size={22} className="text-tg-secondary group-hover:text-tg-accent transition-colors" />
            <div className="flex-1 pb-2">
              <textarea rows={1} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('bio')} className="w-full bg-transparent text-white focus:outline-none text-[16px] resize-none" />
              <p className="text-[12px] text-tg-secondary">{t('bio')}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-tg-sidebar border-y border-tg-border">
          <div className="px-5 py-2 text-xs font-bold text-tg-accent uppercase tracking-widest bg-tg-bg/30">{t('settings')}</div>
          <div onClick={onOpenNotifications}>
            <SettingsItem icon={<Bell size={22} />} label={t('notifications')} />
          </div>
          <div onClick={onOpenPrivacy}>
            <SettingsItem icon={<Lock size={22} />} label={t('privacy')} />
          </div>
          <div onClick={onOpenDataStorage}>
            <SettingsItem 
                icon={<Shield size={22} />} 
                label={t('data')} 
            />
          </div>
          <SettingsItem 
            icon={<Edit2 size={22} />} 
            label={t('chatSettings')} 
            badge={<Badge text={t('soon')} />}
          />
          <div onClick={() => setShowLanguagePicker(true)}>
            <SettingsItem 
              icon={<Globe size={22} />} 
              label={t('language')} 
              badge={<span className="text-tg-accent text-sm font-medium pr-1">{t('langName')}</span>} 
            />
          </div>
        </div>

        <div className="mt-4 bg-tg-sidebar border-y border-tg-border">
          <div onClick={onOpenGuide}>
            <SettingsItem icon={<BookOpen size={22} />} label={t('howToUse')} />
          </div>
          <div onClick={onOpenFAQ}>
            <SettingsItem icon={<HelpCircle size={22} />} label={t('askQuestion')} />
          </div>
          <div onClick={onOpenFeatures}>
            <SettingsItem 
              icon={<Info size={22} />} 
              label={t('features')} 
              badge={<span className="text-tg-accent text-[10px] font-bold bg-tg-accent/10 px-2 py-0.5 rounded border border-tg-accent/20">NEW</span>} 
            />
          </div>
        </div>

        <div className="mt-4 bg-tg-sidebar border-y border-tg-border">
          <div 
            onClick={onLogout}
            className="px-5 py-4 flex items-center space-x-6 hover:bg-red-500/10 cursor-pointer transition-colors group"
          >
            <LogOut size={22} className="text-red-500" />
            <span className="text-red-500 font-medium">{t('logout')}</span>
          </div>
        </div>

        {/* Version Footer */}
        <div className="py-6 text-center">
            <p className="text-xs text-tg-secondary font-medium tracking-wide opacity-50">
                {t('version')}
            </p>
            <p className="text-[10px] text-tg-secondary opacity-30 mt-1">
                Alpha Build
            </p>
        </div>
        <div className="pb-16" />
      </div>

      {showLanguagePicker && (
        <div className="fixed inset-0 z-50 flex flex-col bg-tg-bg animate-fadeIn">
          <div className="px-4 py-3 pt-safe flex items-center bg-tg-sidebar border-b border-tg-border shadow-md min-h-[60px]">
            <button onClick={() => setShowLanguagePicker(false)} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <span className="text-white font-bold text-xl ml-4">{t('language')}</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-tg-sidebar">
            {LANGUAGES.map((lang) => (
              <div 
                key={lang.id} 
                onClick={() => { setLanguage(lang.id); setShowLanguagePicker(false); }}
                className="px-6 py-4 flex items-center justify-between border-b border-tg-border/30 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <span className={`text-[17px] ${language === lang.id ? 'text-tg-accent font-bold' : 'text-white'}`}>{lang.name}</span>
                {language === lang.id && <Check size={20} className="text-tg-accent" strokeWidth={3} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsItem: React.FC<{ icon: React.ReactNode; label: string; badge?: React.ReactNode }> = ({ icon, label, badge }) => (
  <div className="px-5 py-4 flex items-center space-x-6 hover:bg-white/5 cursor-pointer transition-colors group">
    <div className="text-tg-secondary group-hover:text-tg-accent transition-colors">{icon}</div>
    <div className="flex-1 border-b border-tg-border/50 pb-4 group-last:border-none flex justify-between items-center min-w-0">
      <span className="text-white text-[16px] truncate pr-2">{label}</span>
      <div className="flex items-center space-x-3 shrink-0">
        {badge}
        <div className="w-1.5 h-1.5 border-t-2 border-r-2 border-tg-secondary/50 rotate-45" />
      </div>
    </div>
  </div>
);

const Badge: React.FC<{ text: string; locked?: boolean }> = ({ text, locked }) => (
  <div className="flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-tg-accent/10 border border-tg-accent/20 text-[10px] font-bold text-tg-accent shadow-[0_2px_8px_rgba(42,171,238,0.1)] transition-transform group-hover:scale-105 shrink-0">
    {locked && <Lock size={10} className="opacity-70" />}
    <span className="tracking-wide uppercase">{text}</span>
  </div>
);

export default ProfileScreen;
